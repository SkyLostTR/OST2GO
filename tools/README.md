# OST2GO Tools

**Utility scripts for OST2GO development and testing**

*OST2GO by SkyLostTR (@Keeftraum)*  
*Repository: https://github.com/SkyLostTR/OST2GO*

---

## Overview

This directory contains utility scripts for development, testing, and debugging OST2GO functionality.

## Available Tools

### 📊 Analysis Tools

#### `analyze-ost.js`
Analyze OST file structure and display detailed information.

```bash
node tools/analyze-ost.js
```

#### `deep-analysis.js`
Perform deep analysis of OST file structure including table scanning.

```bash
node tools/deep-analysis.js
```

#### `deep-analyze.js`
Alternative deep analysis tool with different output format.

```bash
node tools/deep-analyze.js
```

### 📧 Extraction Tools

#### `extract-to-eml.js`
Standalone email extraction tool (legacy version before CLI integration).

```bash
node tools/extract-to-eml.js --input=yourfile.ost --max=100 --output=my-emails
```

**Options:**
- `--input` or `-i` - Input OST file
- `--max` - Maximum emails to extract
- `--output` - Output directory
- `--verbose` - Show detailed progress

### 🔧 Debugging Tools

#### `debug-pst.js`
Debug PST file structure and validate headers.

```bash
node tools/debug-pst.js
```

#### `hexdump.js`
Display hexadecimal dump of file contents.

```bash
node tools/hexdump.js
```

### ✅ Testing Tools

#### `test-validator.js`
Test PST validation functionality.

```bash
node tools/test-validator.js
```

### 🏗️ Creation Tools

#### `create-minimal-pst.js`
Create a minimal PST file for testing purposes.

```bash
node tools/create-minimal-pst.js
```

---

## Usage Notes

These tools are primarily for development and debugging. For regular use, prefer the main `ost2go` CLI:

```bash
# Instead of: node tools/extract-to-eml.js
# Use: ost2go extract -i yourfile.ost -o output

# Instead of: node tools/analyze-ost.js
# Use: ost2go info -i yourfile.ost
```

---

## Development

These tools use the same underlying modules as the main CLI but provide direct access to specific functionality for testing and development.

### Dependencies

All tools require the same dependencies as OST2GO:
- pst-extractor
- chalk
- fs-extra

---

## Contributing

When adding new tools:
1. Follow the naming convention: `verb-noun.js`
2. Include help/usage information
3. Add proper error handling
4. Update this README

---

**OST2GO** - *Making Outlook data accessible*  
Copyright (c) 2024-2025 SkyLostTR (@Keeftraum)
