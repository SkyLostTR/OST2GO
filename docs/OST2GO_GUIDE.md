# 🚀 OST2GO - Complete OST/PST Management Toolkit

**Version 2.0.0** - A comprehensive Node.js application for managing Microsoft Outlook OST and PST files.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Commands](#commands)
  - [Convert](#convert)
  - [Extract](#extract)
  - [Validate](#validate)
  - [Info](#info)
- [Quick Start](#quick-start)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**OST2GO** is a unified command-line tool that provides multiple functionalities for working with Outlook OST and PST files:

- **Convert**: Convert OST files to PST format (both legacy and real conversion)
- **Extract**: Extract emails to EML, MBOX, and JSON formats
- **Validate**: Validate PST file integrity and structure
- **Info**: Display file information and metadata

All functionality is now accessible through a single `ost2go` command with various subcommands.

---

## 📦 Installation

### Prerequisites

- Node.js v16.0.0 or higher
- Windows, macOS, or Linux

### Install Globally

```bash
# Navigate to the project directory
cd O2PT

# Install globally
npm install -g .
```

### Verify Installation

```bash
ost2go --help
```

You should see the main help menu with all available commands.

---

## 🛠️ Commands

### Convert

Convert OST files to PST format with two modes:

#### **Real Mode** (Recommended)
Extracts actual emails and creates proper PST structure.

```bash
ost2go convert -i input.ost -o output.pst --real --max-emails 100
```

**Options:**
- `-i, --input <path>` - Input OST file path (required)
- `-o, --output <path>` - Output PST file path (required)
- `--real` - Use real converter (extracts actual emails)
- `--max-emails <number>` - Maximum emails to extract (default: 50)
- `--utf8` - Ensure UTF-8 encoding support (default: true)
- `--overwrite` - Overwrite output file if it exists
- `--force` - Skip format compatibility warnings

#### **Legacy Mode**
Surface-level conversion (educational purposes only).

```bash
ost2go convert -i input.ost -o output.pst --force
```

⚠️ **Warning**: Legacy mode only changes file headers. Output is NOT readable in PST readers.

---

### Extract

Extract emails from OST/PST files to multiple formats (EML, MBOX, JSON).

```bash
ost2go extract -i input.ost -o output-dir --max 100 --verbose
```

**Options:**
- `-i, --input <path>` - Input OST/PST file path (required)
- `-o, --output <dir>` - Output directory (default: "extracted-emails")
- `--max <number>` - Maximum emails to extract (default: 100)
- `--verbose` - Show detailed extraction information

**Output Files:**
- `eml/` - Individual EML files (one per email)
- `emails.mbox` - MBOX format for email clients
- `emails.json` - JSON backup with full metadata
- `IMPORT_INSTRUCTIONS.txt` - Detailed import guide

---

### Validate

Validate PST file integrity and contents using the pst-extractor library.

```bash
ost2go validate -i file.pst --verbose
```

**Options:**
- `-i, --input <path>` - PST file to validate (required)
- `--verbose` - Show detailed validation information

**Validation Checks:**
- File format and structure
- Email accessibility
- Folder hierarchy
- Attachment integrity

---

### Info

Display detailed information about an OST file.

```bash
ost2go info -i input.ost
```

**Options:**
- `-i, --input <path>` - Input OST file path (required)

**Information Displayed:**
- File size and path
- Creation and modification dates
- File type detection
- Recommendations for conversion

---

## 🚀 Quick Start

### Basic Workflow

1. **Extract emails from OST**
```bash
ost2go extract -i NK@ON.ost -o my-emails --max 500
```

2. **Import EML files to Outlook**
   - Open Outlook
   - Drag and drop `.eml` files from `my-emails/eml/` folder
   - Or use File → Import/Export

3. **Export to PST from Outlook**
   - File → Open & Export → Import/Export
   - Choose "Export to a file" → "Outlook Data File (.pst)"
   - This creates a **valid, working PST file**

### Alternative: Direct Conversion

```bash
# Convert OST to PST using real converter
ost2go convert -i NK@ON.ost -o output.pst --real --max-emails 100
```

### Validate the Result

```bash
# Verify the PST file is valid
ost2go validate -i output.pst --verbose
```

---

## 💡 Examples

### Example 1: Extract All Emails (Large OST)

```bash
ost2go extract -i mailbox.ost -o all-emails --max 10000 --verbose
```

### Example 2: Quick Test Extraction

```bash
ost2go extract -i mailbox.ost -o test --max 5
```

### Example 3: Real Conversion with Many Emails

```bash
ost2go convert -i mailbox.ost -o mailbox.pst --real --max-emails 1000
```

### Example 4: Get File Information

```bash
ost2go info -i mailbox.ost
```

### Example 5: Validate Multiple PST Files

```bash
ost2go validate -i file1.pst
ost2go validate -i file2.pst --verbose
```

---

## 🔧 Troubleshooting

### Command Not Found

If you get "command not found" error:

```bash
# Reinstall globally
npm install -g .

# Or use npx
npx ost2go --help
```

### Extraction Errors

If you encounter extraction errors:

1. Try with a smaller `--max` value
2. Use `--verbose` to see detailed error messages
3. Check file permissions
4. Ensure the OST file is not corrupted

### Conversion Issues

For best results:

- Use `--real` mode for actual email extraction
- Start with smaller `--max-emails` values for testing
- Legacy mode is for educational purposes only

### Import Problems

If EML files don't import correctly:

1. Try importing one file manually first
2. Check that Outlook is installed and working
3. Use Thunderbird with ImportExportTools NG as alternative
4. Consider using the MBOX format instead

---

## 📊 Command Comparison

| Task | Old Command | New Command |
|------|-------------|-------------|
| Extract emails | `node extract-to-eml.js --input=file.ost` | `ost2go extract -i file.ost` |
| Convert OST to PST | `node src/index.js convert -i file.ost -o file.pst` | `ost2go convert -i file.ost -o file.pst` |
| Validate PST | `node src/index.js validate -i file.pst` | `ost2go validate -i file.pst` |
| Get file info | `node src/index.js info -i file.ost` | `ost2go info -i file.ost` |

---

## 🎯 Best Practices

1. **Start Small**: Test with `--max 5` or `--max 10` first
2. **Use Verbose Mode**: Add `--verbose` when troubleshooting
3. **Backup First**: Always keep original OST file as backup
4. **Validate Output**: Use `validate` command to verify PST files
5. **Import to Outlook**: For best results, import EML files to Outlook then export to PST

---

## 📝 Additional Resources

- **IMPORT_INSTRUCTIONS.txt**: Created after extraction with detailed import methods
- **README.md**: Project overview and technical details
- **HOW_TO_RUN.md**: Detailed execution instructions
- **SUCCESS-REPORT.md**: Working solution documentation

---

## 🆘 Support

For issues or questions:

1. Check this guide first
2. Review the generated IMPORT_INSTRUCTIONS.txt file
3. Use `--verbose` flag for detailed error messages
4. Check the project README.md for technical details

---

## 📄 License

MIT License - See LICENSE file for details

---

**OST2GO v2.0.0** - Making OST/PST management simple and unified! 🚀
