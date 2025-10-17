const fs = require('fs-extra');

/**
 * Email Content Scanner - Find actual email text in OST files
 */
class EmailContentScanner {
  constructor() {
    // Common email keywords that indicate real email content
    this.EMAIL_KEYWORDS = [
      'From:', 'To:', 'Subject:', 'Date:', 'Sent:', 'Received:',
      'Message-ID:', 'Content-Type:', 'MIME-Version:', 'X-Mailer:',
      'Reply-To:', 'Return-Path:', 'Delivered-To:'
    ];
    
    // Common email domains to look for
    this.EMAIL_DOMAINS = [
      '@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com',
      '@msn.com', '@live.com', '@aol.com', '@icloud.com'
    ];
    
    // Patterns that indicate actual message content
    this.MESSAGE_PATTERNS = [
      /Dear\s+[A-Za-z]+/i,
      /Best\s+regards/i,
      /Thank\s+you/i,
      /Please\s+find/i,
      /I\s+am\s+writing/i,
      /Hope\s+this\s+helps/i
    ];
  }
  
  /**
   * Scan OST file for actual email content
   */
  async scanForEmails(ostPath, maxEmails = 10) {
    console.log('🔍 Scanning for actual email content...');
    
    const fd = await fs.promises.open(ostPath, 'r');
    const stats = await fd.stat();
    const fileSize = stats.size;
    
    const emails = [];
    const chunkSize = 64 * 1024; // 64KB chunks
    
    try {
      let scannedBytes = 0;
      
      for (let offset = 0; offset < fileSize && emails.length < maxEmails; offset += chunkSize / 2) {
        const buffer = Buffer.alloc(chunkSize);
        const { bytesRead } = await fd.read(buffer, 0, chunkSize, offset);
        
        if (bytesRead === 0) break;
        
        // Try different text encodings
        const texts = [
          buffer.toString('utf8', 0, bytesRead),
          buffer.toString('utf16le', 0, bytesRead),
          buffer.toString('ascii', 0, bytesRead)
        ];
        
        for (const text of texts) {
          const email = this.extractEmailFromText(text, offset);
          if (email && this.isValidEmail(email)) {
            emails.push(email);
            console.log(`📧 Found email at offset ${offset}: "${email.subject}" from ${email.sender}`);
            
            if (emails.length >= maxEmails) break;
          }
        }
        
        scannedBytes += bytesRead;
        
        // Progress update every 50MB
        if (scannedBytes % (50 * 1024 * 1024) === 0) {
          const progress = (scannedBytes / fileSize * 100).toFixed(1);
          process.stdout.write(`\r📊 Scanned ${progress}% (${emails.length} emails found)...`);
        }
      }
      
      console.log(`\n✅ Scan complete. Found ${emails.length} valid emails.`);
      return emails;
      
    } finally {
      await fd.close();
    }
  }
  
  /**
   * Extract email from text content
   */
  extractEmailFromText(text, offset) {
    // Clean up text
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' '); // Remove control chars
    
    // Check if this looks like email content
    const keywordCount = this.EMAIL_KEYWORDS.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    if (keywordCount < 2) return null; // Need at least 2 email keywords
    
    const email = {
      offset: offset,
      rawText: text.substring(0, 2000) // Keep first 2000 chars for analysis
    };
    
    // Extract From
    let match = text.match(/From:\s*([^\r\n]+)/i);
    if (match) {
      email.sender = this.cleanEmailAddress(match[1]);
    }
    
    // Extract To  
    match = text.match(/To:\s*([^\r\n]+)/i);
    if (match) {
      email.recipient = this.cleanEmailAddress(match[1]);
    }
    
    // Extract Subject
    match = text.match(/Subject:\s*([^\r\n]+)/i);
    if (match) {
      email.subject = match[1].trim();
    }
    
    // Extract Date
    match = text.match(/Date:\s*([^\r\n]+)/i);
    if (match) {
      try {
        email.date = new Date(match[1].trim());
      } catch {
        email.date = new Date();
      }
    }
    
    // Extract body content
    const bodyMatch = text.match(/\n\s*\n([\s\S]+?)(\n\s*From:|$)/);
    if (bodyMatch) {
      email.body = bodyMatch[1].trim().substring(0, 5000);
    }
    
    // If no standard headers found, try alternative patterns
    if (!email.subject && !email.sender) {
      return this.extractAlternativeFormat(text, offset);
    }
    
    return email;
  }
  
  /**
   * Extract from alternative/proprietary formats
   */
  extractAlternativeFormat(text, offset) {
    const email = { offset: offset };
    
    // Look for email addresses anywhere in text
    const emailAddresses = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailAddresses && emailAddresses.length > 0) {
      email.sender = emailAddresses[0];
      if (emailAddresses.length > 1) {
        email.recipient = emailAddresses[1];
      }
    }
    
    // Look for message-like patterns
    for (const pattern of this.MESSAGE_PATTERNS) {
      if (pattern.test(text)) {
        // Extract surrounding text as potential subject/body
        const lines = text.split(/[\r\n]+/);
        const meaningfulLines = lines.filter(line => 
          line.trim().length > 10 && 
          line.trim().length < 200 &&
          !line.includes('\x00')
        );
        
        if (meaningfulLines.length > 0) {
          email.subject = meaningfulLines[0];
          if (meaningfulLines.length > 1) {
            email.body = meaningfulLines.slice(1, 5).join('\n');
          }
        }
        break;
      }
    }
    
    return Object.keys(email).length > 2 ? email : null;
  }
  
  /**
   * Clean and validate email address
   */
  cleanEmailAddress(emailStr) {
    // Remove quotes, brackets, and extra spaces
    const cleaned = emailStr.replace(/[<>"']/g, '').trim();
    
    // Extract just the email address if there's a name
    const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : cleaned;
  }
  
  /**
   * Validate if extracted email looks legitimate
   */
  isValidEmail(email) {
    // Must have subject or sender
    if (!email.subject && !email.sender) return false;
    
    // Subject shouldn't be just garbage
    if (email.subject) {
      const subject = email.subject.trim();
      if (subject.length < 3 || subject.length > 300) return false;
      
      // Check for too many special characters (indicates binary data)
      const specialChars = (subject.match(/[^\w\s\-.,!?()]/g) || []).length;
      if (specialChars > subject.length / 3) return false;
    }
    
    // Sender should look like an email if present
    if (email.sender) {
      if (email.sender.includes('@')) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.sender)) {
          return false;
        }
      }
    }
    
    return true;
  }
}

module.exports = EmailContentScanner;