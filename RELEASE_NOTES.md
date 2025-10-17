# OST2GO v2.1.0 - Binary Release

**OST2GO by SkyLostTR (@Keeftraum)**

## 🎉 New: Standalone Binaries Available!

OST2GO now provides standalone executable binaries that don't require Node.js installation!

## 📦 Downloads

| Platform | Filename | Size | SHA256 Checksum |
|----------|----------|------|-----------------|
| Windows (x64) | `ost2go-win.exe` | 83.87 MB | _(Generate after building)_ |
| Linux (x64) | `ost2go-linux` | 92.10 MB | _(Generate after building)_ |
| macOS (x64) | `ost2go-macos` | 96.85 MB | _(Generate after building)_ |

## ✨ What's New in v2.1.0

### Standalone Binaries
- **No Node.js Required**: Pre-built executables include everything needed
- **Cross-Platform**: Windows, Linux, and macOS support
- **Easy Distribution**: Single file deployment
- **Full Feature Set**: All OST2GO functionality included

### Build System
- Build scripts for generating binaries
- Automated packaging with `pkg`
- Multi-platform build support

## 🚀 Quick Start

### Windows
```powershell
# Download ost2go-win.exe
.\ost2go-win.exe --version
.\ost2go-win.exe --help
```

### Linux
```bash
# Download ost2go-linux
chmod +x ost2go-linux
./ost2go-linux --version
./ost2go-linux --help
```

### macOS
```bash
# Download ost2go-macos
chmod +x ost2go-macos
./ost2go-macos --version
./ost2go-macos --help
```

## 💡 Usage Examples

### Convert OST to PST
```bash
# Windows
.\ost2go-win.exe convert -i yourfile.ost -o output.pst --real --max-emails 100

# Linux/macOS
./ost2go-linux convert -i yourfile.ost -o output.pst --real --max-emails 100
```

### Extract Emails to EML Format
```bash
# Windows
.\ost2go-win.exe extract -i yourfile.ost -o emails --format eml --max 50

# Linux/macOS
./ost2go-linux extract -i yourfile.ost -o emails --format eml --max 50
```

### Get File Information
```bash
# Windows
.\ost2go-win.exe info -i yourfile.ost

# Linux/macOS
./ost2go-linux info -i yourfile.ost
```

### Validate PST File
```bash
# Windows
.\ost2go-win.exe validate -i output.pst

# Linux/macOS
./ost2go-linux validate -i output.pst
```

## 📋 Full Feature List

- ✅ **OST to PST Conversion** (Real & Legacy modes)
- ✅ **Email Extraction** (EML, MBOX, JSON formats)
- ✅ **PST Validation** (Integrity checking)
- ✅ **File Information** (Metadata display)
- ✅ **UTF-8 Support** (International characters)
- ✅ **Progress Tracking** (Visual feedback)
- ✅ **Error Handling** (Graceful failures)
- ✅ **Verbose Logging** (Debug mode)

## 🔧 Installation Options

### Option 1: Standalone Binary (Recommended for Users)
- Download the binary for your platform
- No installation required
- Run directly from any location

### Option 2: npm Global Install (For Developers)
```bash
npm install -g ost2go
ost2go --version
```

### Option 3: From Source (For Contributors)
```bash
git clone https://github.com/SkyLostTR/OST2GO.git
cd OST2GO
npm install
npm start
```

## 📚 Documentation

- **Quick Start**: `docs/QUICK_START.md`
- **Complete Guide**: `docs/OST2GO_GUIDE.md`
- **Build Guide**: `docs/BUILD_GUIDE.md`
- **API Reference**: `docs/OST2GO_COMPLETE.md`
- **Quick Reference**: `docs/QUICK_REFERENCE.md`
- **Technical Limitations**: `docs/TECHNICAL-LIMITATIONS.md`

## 🐛 Known Limitations

- Generated PST files may have limited compatibility with some email clients
- This tool is intended for educational/research purposes
- OST structure conversion is surface-level only
- Large files (>4GB) may require significant memory

## 🆘 Support

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions
- **Repository**: https://github.com/SkyLostTR/OST2GO

## 📄 License

Proprietary - See LICENSE file for terms and conditions

## 🙏 Acknowledgments

- Node.js community
- pst-extractor library maintainers
- All contributors and testers

## 🔐 Security Notes

### Generating Checksums

After building, generate checksums for verification:

```bash
# Windows (PowerShell)
Get-FileHash .\dist\ost2go-win.exe -Algorithm SHA256

# Linux/macOS
sha256sum dist/ost2go-linux
sha256sum dist/ost2go-macos
```

### Verifying Downloads

Users should verify checksums before using:

```bash
# Windows
Get-FileHash .\ost2go-win.exe -Algorithm SHA256

# Linux/macOS
sha256sum ost2go-linux
```

## 🏗️ Building from Source

To build your own binaries:

```bash
# Install dependencies
npm install

# Build all platforms
npm run build:all

# Or build specific platform
npm run build:win    # Windows
npm run build:linux  # Linux
npm run build:mac    # macOS
```

See `docs/BUILD_GUIDE.md` for detailed build instructions.

---

**OST2GO v2.1.0** - Released October 17, 2025

**Author**: SkyLostTR (@Keeftraum)
**Repository**: https://github.com/SkyLostTR/OST2GO
