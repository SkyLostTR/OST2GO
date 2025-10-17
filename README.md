# 🚀 OST2GO - ![Logo](https://i.imgur.com/htRNNnp.png) 


> **Complete OST/PST Management Toolkit**  
> *Convert, extract, and manage Microsoft Outlook OST files with ease*

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/SkyLostTR/OST2GO)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)
[![NPM Downloads](https://img.shields.io/npm/dt/ost2go.svg)](https://www.npmjs.com/package/ost2go)
[![Package Size](https://img.shields.io/bundlephobia/min/ost2go.svg)](https://bundlephobia.com/result?p=ost2go)
[![GitHub Stars](https://img.shields.io/github/stars/SkyLostTR/OST2GO.svg)](https://github.com/SkyLostTR/OST2GO/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/SkyLostTR/OST2GO.svg)](https://github.com/SkyLostTR/OST2GO/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/SkyLostTR/OST2GO.svg)](https://github.com/SkyLostTR/OST2GO/pulls)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/SkyLostTR/OST2GO)
[![Last Commit](https://img.shields.io/github/last-commit/SkyLostTR/OST2GO.svg)](https://github.com/SkyLostTR/OST2GO/commits/master)
[![Build Status](https://img.shields.io/github/actions/workflow/status/SkyLostTR/OST2GO/ci.yml?branch=master)](https://github.com/SkyLostTR/OST2GO/actions)

**Created by [SkyLostTR](https://github.com/SkyLostTR) (@Keeftraum)**

---

**Version 2.0.0** - A unified Node.js application for converting, extracting, and managing Microsoft Outlook OST and PST files with UTF-8 support.

## 🎯 What's New in Version 2.0

### ✅ Unified Command Interface

All functionality is now accessible through a single `ost2go` command with intuitive subcommands:

- **`ost2go convert`** - Convert OST to PST (real & legacy modes)
- **`ost2go extract`** - Extract emails to EML, MBOX, and JSON
- **`ost2go validate`** - Validate PST file integrity
- **`ost2go info`** - Display file information

### 🚀 Quick Installation

```bash
npm install -g .
ost2go --help
```

## Important Updates - Version 2.0

### ⚠️ **Issue Resolution: Email Client Crashes**

**Problem**: Previous versions created PST files that crashed Outlook and Thunderbird during import.

**Root Cause**: The original implementation was too simplistic and didn't properly handle:
- PST header structure and format identifiers
- Block alignment and data structure compliance
- CRC checksums and file integrity validation

**Solution**: Completely rewritten converter with:
- ✅ **Proper PST header generation** with correct format identifiers
- ✅ **Block-level data processing** for PST compliance
- ✅ **CRC32 checksum calculation** for file integrity
- ✅ **Advanced error handling** and validation
- ✅ **UTF-8 encoding preservation** for international content

### ⚠️ **Critical Compatibility Notice - READ BEFORE USE**

This is an **educational/research proof-of-concept** with **MAJOR limitations**:

#### **❌ KNOWN ISSUES - Current Version**:
- **Generated PST files are NOT readable by standard PST readers** (Outlook, XstReader, etc.)
- **Internal structure conversion is incomplete** - only header is modified
- **OST database structures remain unchanged** causing parse errors in PST readers
- **This tool performs surface-level conversion only**

#### **🔧 Technical Explanation**:
OST files use proprietary Microsoft Exchange-locked database structures that are fundamentally different from PST format. True conversion requires:
- Complete B-tree database restructuring
- Node reference table rebuilding  
- Block allocation table conversion
- Encryption/compression handling
- Exchange-specific metadata removal

**Our tool currently only:**
- ✅ Changes file header from OST to PST format
- ✅ Processes data in chunks with basic block alignment
- ❌ Does NOT convert internal database structures
- ❌ Does NOT rebuild B-tree indexes
- ❌ Does NOT handle Exchange-specific encryption

#### **⚠️ For Actual OST to PST Conversion - Use These Instead:**

1. **Microsoft Outlook Built-in Tools** (RECOMMENDED):
   ```
   File → Open & Export → Import/Export → Export to a file → Outlook Data File (.pst)
   ```

2. **Microsoft Official Utilities**:
   - PST Capture tool
   - Exchange Admin Center export features
   - PowerShell Export-Mailbox cmdlets

3. **Commercial Solutions**:
   - Aspose.Email for .NET
   - Stellar OST to PST Converter
   - SysTools OST Recovery

#### **📚 Educational Value**:
This project demonstrates:
- PST/OST file format structure basics
- Node.js file processing techniques  
- CLI application development patterns
- Progress tracking and error handling

**📖 For detailed technical explanation of why this doesn't work, see [TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md)**

## ✨ Features

- **🔄 OST to PST Conversion**: Convert Outlook OST files to PST format with improved compatibility
- **🌍 UTF-8 Support**: Ensures proper encoding for international characters
- **📊 Progress Tracking**: Real-time progress display during conversion
- **✅ File Validation**: Validates input and output files with integrity checks
- **💻 Command Line Interface**: Easy-to-use CLI with comprehensive options
- **🛠️ Advanced Error Handling**: Detailed error reporting and troubleshooting
- **📁 PST Format Compliance**: Proper header structure and block alignment

## 📦 Installation

1. **✅ Make sure you have Node.js 16+ installed**
2. **📥 Clone or download this project**
3. **🔧 Install dependencies:**

```bash
npm install
```

## 📖 Quick Start Guide

### Installation

```bash
# Install globally
npm install -g .

# Verify installation
ost2go --help
```

### 💡 Usage Examples

#### 📧 Extract Emails (Recommended Method)

```bash
# Extract emails to EML, MBOX, and JSON formats
ost2go extract -i input.ost -o my-emails --max 100

# Extract with verbose output
ost2go extract -i input.ost -o my-emails --max 500 --verbose
```

#### 🔄 Convert OST to PST

```bash
# RECOMMENDED: Real converter (extracts actual emails)
ost2go convert -i input.ost -o output.pst --real --max-emails 100

# Legacy converter (educational only - output not readable)
ost2go convert -i input.ost -o output.pst --force
```

#### ✅ Validate PST Files

```bash
# Validate a PST file
ost2go validate -i output.pst

# Validate with detailed output
ost2go validate -i output.pst --verbose
```

#### ℹ️ Get File Information

```bash
# Display OST file information
ost2go info -i input.ost
```

### 📋 Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `ost2go convert` | 🔄 Convert OST to PST | `ost2go convert -i file.ost -o file.pst --real` |
| `ost2go extract` | 📧 Extract to EML/MBOX/JSON | `ost2go extract -i file.ost -o output --max 100` |
| `ost2go validate` | ✅ Validate PST integrity | `ost2go validate -i file.pst --verbose` |
| `ost2go info` | ℹ️ Show file information | `ost2go info -i file.ost` |

📚 **For comprehensive documentation, see [OST2GO_GUIDE.md](./OST2GO_GUIDE.md)**

### Command Line Options

#### Convert Command
- `-i, --input <path>`: Input OST file path (required)
- `-o, --output <path>`: Output PST file path (required)
- `--utf8`: Ensure UTF-8 encoding support (default: true)
- `--overwrite`: Overwrite output file if it exists (default: false)
- `--force`: Skip format compatibility warnings (default: false)
- `--real`: Use real converter to extract actual emails (recommended)
- `--max-emails <number>`: Maximum number of emails to convert (default: 100)

#### Validate Command
- `-i, --input <path>`: PST file path to validate (required)
- `--verbose`: Show detailed validation information

#### Info Command
- `-i, --input <path>`: Input OST file path (required)

## 💡 Examples

```bash
# Convert a typical OST file (with compatibility warning)
node src/index.js convert -i "C:\Users\John\Documents\Outlook Files\archive.ost" -o "C:\Users\John\Documents\Outlook Files\archive.pst"

# Get information about an OST file
node src/index.js info -i "C:\Users\John\Documents\Outlook Files\archive.ost"

# Convert with overwrite enabled and skip warnings
node src/index.js convert -i "./input.ost" -o "./output.pst" --overwrite --force

# Test conversion with a small file first
node src/index.js convert -i "small_test.ost" -o "test_output.pst" --force
```

## 🚨 Troubleshooting Email Client Crashes

### If Outlook/Thunderbird Still Crashes:

1. **Try a smaller test file first**:
   ```bash
   # Create a test with a portion of your OST
   node src/index.js convert -i "small_sample.ost" -o "test.pst" --force
   ```

2. **🏢 Use Microsoft's official tools**:
   - Open Outlook
   - Go to File → Open & Export → Import/Export
   - Choose "Export to a file" → "Outlook Data File (.pst)"

3. **Check file integrity**:
   ```bash
   # Get file information to verify the conversion
   node src/index.js info -i "converted_file.pst"
   ```

4. **Import gradually**:
   - Import only a few folders at a time
   - Check for specific problematic emails or attachments

### 🛠️ Common Issues and Solutions:

| Issue | Solution |
|-------|----------|
| PST file too large | Split large OST files before conversion |
| Encoding problems | Ensure `--utf8` flag is enabled (default) |
| Corrupted source OST | Use `scanpst.exe` to repair the OST file first |
| Memory errors | Close other applications, use smaller chunks |
| Import hangs | Try importing specific folders instead of entire PST |

## 🛠️ Development

### 🧪 Running Tests

```bash
npm test
```

### 🔄 Development Mode with Auto-restart

```bash
npm run dev
```

## 🔧 Technical Details

### 📁 OST vs PST Format

- **OST files**: Offline Storage Table files used by Outlook for cached email data
- **PST files**: Personal Storage Table files used for archiving and backup
- Both formats share similar internal structure but have different headers and metadata

### 🌍 UTF-8 Support

The converter ensures that text content within emails maintains proper UTF-8 encoding, which is essential for:
- International characters (á, é, í, ó, ú, ñ, etc.)
- Emoji and special symbols
- Multi-language email content

### ⚡ File Processing

The converter processes files in chunks to handle large OST files efficiently:
- Default chunk size: 1MB
- Progress tracking for large files
- Memory-efficient streaming

## ⚠️ Important Notes

### 🚨 Disclaimer

This is a **proof-of-concept implementation** for educational purposes. The actual OST/PST file formats are proprietary Microsoft formats with complex internal structures. For production use, consider:

1. **🏢 Microsoft's official tools**: Use Outlook's built-in import/export functionality
2. **💼 Professional libraries**: Consider commercial solutions like Aspose.Email or similar
3. **🖥️ Exchange Server**: Use server-side conversion tools when available

### 📋 Limitations

- This implementation provides a basic framework but may not handle all OST format variations
- Complex email attachments, calendar items, and advanced features may require additional processing
- Microsoft's PST format has evolved over different Outlook versions (97, 2003, 2007+)

### ⚖️ Legal Considerations

- Ensure you have proper rights to convert OST files
- Respect data privacy and corporate policies
- Consider encryption and security requirements

## File Structure

```
ost-to-pst-converter/
├── 📁 src/
│   ├── 📄 index.js                 # Main CLI application
│   └── 📁 converter/
│       └── 📄 OstToPstConverter.js # Core conversion logic
├── 📁 test/
│   └── 📄 test.js                  # Test suite
├── 📄 package.json                 # Project dependencies and scripts
└── 📄 README.md                   # This file
```

## 🤝 Contributing

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch**
3. **✏️ Make your changes**
4. **🧪 Run tests: `npm test`**
5. **📤 Submit a pull request**

## License

This project is licensed under a proprietary license - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. **🔍 Check the troubleshooting section below**
2. **🧪 Review the test results with `npm test`**
3. **🔧 Ensure your Node.js version is 16+**

## 🔧 Troubleshooting

### 🚨 Common Issues

1. **"Input file does not exist"**
   - Verify the file path is correct
   - Use absolute paths when possible
   - Check file permissions

2. **"Output file already exists"**
   - Use the `--overwrite` flag to replace existing files
   - Choose a different output path

3. **"Conversion failed"**
   - Ensure the input file is a valid OST file
   - Check available disk space
   - Verify file is not corrupted or locked by Outlook

4. **"UTF-8 encoding issues"**
   - The converter attempts to handle encoding automatically
   - For complex encoding issues, consider professional tools

### ⚡ Performance Tips

- Close Outlook before converting OST files
- Ensure sufficient disk space (PST files can be similar size to OST)
- Use SSD storage for better performance with large files
- Consider converting large files in smaller segments if needed

## License

This project is licensed under a proprietary license - see the [LICENSE](./LICENSE) file for details.

## Author

**OST2GO** is created and maintained by [SkyLostTR](https://github.com/SkyLostTR) (@Keeftraum)

## Repository

- **GitHub**: https://github.com/SkyLostTR/OST2GO
- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions

---

**OST2GO v2.0.0** - Complete OST/PST Management Toolkit  
*Built with ❤️ by SkyLostTR (@Keeftraum)*

