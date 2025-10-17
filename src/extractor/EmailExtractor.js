const fs = require('fs-extra');

/**
 * Email Extractor - Extract email data from OST file patterns
 */
class EmailExtractor {
  constructor() {
    // Common email patterns to search for
    this.EMAIL_PATTERNS = {
      HEADERS: [
        /From:\s*(.+?)[\r\n]/gi,
        /To:\s*(.+?)[\r\n]/gi,
        /Subject:\s*(.+?)[\r\n]/gi,
        /Date:\s*(.+?)[\r\n]/gi,
        /Message-ID:\s*(.+?)[\r\n]/gi
      ],

      MAPI_PROPERTIES: {
        // Common MAPI property signatures
        0x0037: 'Subject',      // PR_SUBJECT
        0x0C1A: 'SenderName',   // PR_SENDER_NAME
        0x0C1F: 'SenderEmail',  // PR_SENDER_EMAIL_ADDRESS
        0x1000: 'Body',         // PR_BODY
        0x1013: 'BodyHtml',     // PR_BODY_HTML
        0x3007: 'CreationTime', // PR_CREATION_TIME
        0x001A: 'MessageClass'  // PR_MESSAGE_CLASS
      }
    };
  }

  /**
   * Extract emails from OST file using discovered patterns
   */
  async extractEmails(ostPath, patterns, maxEmails = 10) {
    console.log(`📧 Extracting emails from ${patterns.length} discovered patterns...`);

    const emails = [];
    const fd = await fs.promises.open(ostPath, 'r');

    try {
      // Process promising patterns
      for (let i = 0; i < Math.min(patterns.length, 100); i++) {
        const pattern = patterns[i];

        try {
          const email = await this.extractEmailFromPattern(fd, pattern);
          if (email && email.subject) {
            emails.push(email);
            console.log(`✉️  Found: "${email.subject}" from ${email.sender || 'Unknown'}`);

            if (emails.length >= maxEmails) break;
          }
        } catch (error) {
          // Continue with next pattern if this one fails
          continue;
        }
      }

      console.log(`📬 Extracted ${emails.length} emails`);
      return emails;

    } finally {
      await fd.close();
    }
  }

  /**
   * Extract email from a specific pattern location
   */
  async extractEmailFromPattern(fd, pattern) {
    // Read a larger chunk around the pattern
    const chunkSize = 32 * 1024; // 32KB for more context
    const buffer = Buffer.alloc(chunkSize);

    const readOffset = Math.max(0, pattern.offset - chunkSize / 4);
    const { bytesRead } = await fd.read(buffer, 0, chunkSize, readOffset);

    if (bytesRead === 0) return null;

    // Try multiple text encodings
    let email = null;

    // UTF-8 first
    let text = buffer.toString('utf8', 0, bytesRead);
    email = this.extractEmailFromHeaders(text);

    if (!email || !email.subject) {
      // Try UTF-16 (common in Outlook)
      text = buffer.toString('utf16le', 0, bytesRead);
      email = this.extractEmailFromHeaders(text);
    }

    if (!email || !email.subject) {
      // Try ASCII
      text = buffer.toString('ascii', 0, bytesRead);
      email = this.extractEmailFromHeaders(text);
    }

    if (!email || !email.subject) {
      email = await this.extractEmailFromMAPI(fd, pattern.offset);
    }

    if (!email || !email.subject) {
      email = this.extractEmailFromBinary(buffer);
    }

    return email;
  }

  /**
   * Extract email from RFC822-style headers
   */
  extractEmailFromHeaders(text) {
    const email = {};

    // Extract common headers
    const fromMatch = text.match(/From:\s*(.+?)[\r\n]/i);
    if (fromMatch) email.sender = fromMatch[1].trim();

    const toMatch = text.match(/To:\s*(.+?)[\r\n]/i);
    if (toMatch) email.recipient = toMatch[1].trim();

    const subjectMatch = text.match(/Subject:\s*(.+?)[\r\n]/i);
    if (subjectMatch) email.subject = subjectMatch[1].trim();

    const dateMatch = text.match(/Date:\s*(.+?)[\r\n]/i);
    if (dateMatch) {
      try {
        email.date = new Date(dateMatch[1].trim());
      } catch {
        email.date = new Date();
      }
    }

    // Extract body (after headers)
    const bodyStartMatch = text.match(/[\r\n][\r\n](.+)/s);
    if (bodyStartMatch) {
      email.body = bodyStartMatch[1].substring(0, 1000).trim(); // First 1000 chars
    }

    return Object.keys(email).length > 1 ? email : null;
  }

  /**
   * Extract email from MAPI property structures
   */
  async extractEmailFromMAPI(fd, offset) {
    try {
      // Read potential MAPI property block
      const buffer = Buffer.alloc(4096);
      const { bytesRead } = await fd.read(buffer, 0, 4096, offset);

      const email = {};

      // Look for MAPI property signatures
      for (let i = 0; i < buffer.length - 8; i += 4) {
        const propTag = buffer.readUInt32LE(i);
        const propType = propTag & 0xFFFF;
        const propId = (propTag >> 16) & 0xFFFF;

        if (this.EMAIL_PATTERNS.MAPI_PROPERTIES[propId]) {
          const propName = this.EMAIL_PATTERNS.MAPI_PROPERTIES[propId];

          try {
            let value;

            if (propType === 0x001F) { // Unicode string
              const length = buffer.readUInt32LE(i + 4);
              if (length > 0 && length < 1000 && i + 8 + length < buffer.length) {
                value = buffer.toString('utf16le', i + 8, i + 8 + length);
              }
            } else if (propType === 0x001E) { // ANSI string
              const length = buffer.readUInt32LE(i + 4);
              if (length > 0 && length < 1000 && i + 8 + length < buffer.length) {
                value = buffer.toString('ascii', i + 8, i + 8 + length);
              }
            } else if (propType === 0x0003) { // 32-bit integer
              value = buffer.readUInt32LE(i + 4);
            }

            if (value && typeof value === 'string' && value.length > 0) {
              email[propName.toLowerCase()] = value.trim();
            }
          } catch (error) {
            // Continue with next property
            continue;
          }
        }
      }

      return Object.keys(email).length > 1 ? email : null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Extract email from binary data using heuristics
   */
  extractEmailFromBinary(buffer) {
    const email = {};

    // Convert to text and look for email-like patterns
    let text = buffer.toString('utf8').replace(/\x00/g, ''); // Remove null bytes

    // Skip binary/image data
    if (text.includes('PNG') || text.includes('JFIF') || text.includes('jpg@') || text.length < 50) {
      return null;
    }

    // Look for email addresses (but not file paths or weird ones)
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      // Filter out false positives
      const validEmails = emailMatches.filter(email =>
        !email.includes('.jpg@') &&
        !email.includes('.png@') &&
        email.length < 50 &&
        email.split('@')[1].includes('.')
      );

      if (validEmails.length > 0) {
        email.sender = validEmails[0];
        if (validEmails.length > 1) {
          email.recipient = validEmails[1];
        }
      }
    }

    // Look for subject-like patterns (common words followed by colon)
    const subjectPatterns = [
      /(?:Subject|Re:|Fwd?:|RE:|FW:)\s*:?\s*(.+?)[\r\n]/i,
      /^(.{10,80})[\r\n]/m // First line that looks like a subject
    ];

    for (const pattern of subjectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        email.subject = match[1].trim();
        break;
      }
    }

    // Extract date patterns
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      try {
        email.date = new Date(dateMatch[0]);
      } catch {
        email.date = new Date();
      }
    }

    // Extract potential message body
    const lines = text.split(/[\r\n]+/);
    const meaningfulLines = lines.filter(line =>
      line.length > 10 &&
      !line.includes('@') &&
      !line.match(/^(From|To|Subject|Date):/i)
    );

    if (meaningfulLines.length > 0) {
      email.body = meaningfulLines.slice(0, 3).join(' ').substring(0, 500);
    }

    return Object.keys(email).length > 1 ? email : null;
  }

  /**
   * Clean and validate extracted email
   */
  cleanEmail(email) {
    const cleaned = {};

    // Clean subject
    if (email.subject) {
      cleaned.subject = email.subject
        .replace(/^(Re:|Fwd?:|RE:|FW:)\s*/i, '')
        .replace(/[^\w\s\-\.\(\)]/g, '')
        .trim()
        .substring(0, 255);
    }

    // Clean sender
    if (email.sender) {
      cleaned.sender = email.sender
        .replace(/[<>"']/g, '')
        .trim()
        .substring(0, 255);
    }

    // Clean recipient
    if (email.recipient) {
      cleaned.recipient = email.recipient
        .replace(/[<>"']/g, '')
        .trim()
        .substring(0, 255);
    }

    // Clean body
    if (email.body) {
      cleaned.body = email.body
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 10000);
    }

    // Ensure date
    cleaned.date = email.date instanceof Date ? email.date : new Date();

    // Set default values if missing
    cleaned.subject = cleaned.subject || 'No Subject';
    cleaned.sender = cleaned.sender || 'Unknown Sender';
    cleaned.body = cleaned.body || '(No message content available)';

    return cleaned;
  }
}

module.exports = EmailExtractor;