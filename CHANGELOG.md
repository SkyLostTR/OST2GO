# Changelog

All notable changes to OST2GO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.2] - 2025-10-17

### 🎨 Enhanced User Interface

#### Added
- **Colorful Help Display**: Completely redesigned help output with vibrant colors
  - Cyan bordered header with version display (🚀 OST2GO v2.1.2)
  - Colorful credits box showing author, website, and GitHub links
  - Yellow "Usage" section, green "Options" and "Commands" headers
  - Cyan command and option flags for better readability
  - White descriptions with proper formatting
- **Website Integration**: Added official website link (https://ost2go.kief.fi) to help display
  - Blue underlined links for website and GitHub
  - Displayed prominently with emoji indicators (🌐 and 📂)
- **Credits Everywhere**: Credits box now appears on all help displays
  - Shows on `--help`, `-h`, and when no arguments provided
  - Enhanced with emojis: 👤 Author, 🌐 Website, 📂 GitHub, 📦 Project
  - Colorized with cyan borders, green author name, and blue links

#### Changed
- Upgraded credits display from gray to colorful cyan-bordered box
- Improved help output formatting with better color coordination
- Enhanced branding visibility throughout CLI interface

#### Fixed
- Removed duplicate help message that appeared when running without arguments
- Fixed redundant help display in Commander.js setup

## [2.1.0] - 2025-10-17

### 🚀 Standalone Binary Release

#### Added
- **Standalone Binaries**: Pre-built executables for Windows, Linux, and macOS
  - Windows (x64): `ost2go-win.exe` (~84 MB)
  - Linux (x64): `ost2go-linux` (~92 MB)
  - macOS (x64): `ost2go-macos` (~97 MB)
- **No Node.js Required**: Binaries include complete Node.js runtime
- **Build System**: npm scripts for building binaries
  - `npm run build` - Build all platforms
  - `npm run build:win` - Build Windows binary
  - `npm run build:linux` - Build Linux binary
  - `npm run build:mac` - Build macOS binary
  - `npm run build:all` - Build all with default naming
- **Build Documentation**: Comprehensive build guide in `docs/BUILD_GUIDE.md`
- **Binary Distribution Guide**: Installation instructions in `dist/README.md`
- **CI/CD Automation**: GitHub Actions workflows for automated publishing
  - Automatic publish on version change (`publish.yml`)
  - Manual release workflow with options (`release.yml`)
  - Binary building workflow (`build-binaries.yml`)
- **Publishing Documentation**:
  - Complete publishing guide in `docs/PUBLISHING_GUIDE.md`
  - Quick reference in `docs/CI_CD_REFERENCE.md`
  - GitHub setup guide in `docs/GITHUB_SETUP.md`
- **npm Package Publishing**: Automated publishing to npm on version changes
- **GitHub Packages Publishing**: Automated publishing to GitHub Packages
- **GitHub Releases**: Automated release creation with binaries and checksums
- **Package Exclusions**: `.npmignore` file to control published package contents

#### Changed
- Updated `package.json` with pkg configuration and build scripts
- Added `pkg` as development dependency
- Updated README.md with multiple installation options
- Updated badges in README.md to reflect new version and build status

#### Technical
- Uses `pkg` (v5.8.1) to create standalone executables
- Includes all dependencies in binaries
- Based on Node.js v18.5.0 runtime
- Automated version detection and changelog extraction
- SHA256 checksum generation for all binaries
- Multi-platform builds with GitHub Actions
- Automatic tagging and release notes from CHANGELOG.md

## [2.0.0] - 2025-01-17

### 🎉 Major Release - Complete Rewrite

#### Added
- **Unified CLI Interface**: Single `ost2go` command with subcommands (convert, extract, validate, info)
- **Global Installation**: Install once via npm and use anywhere
- **Multiple Export Formats**: Support for EML, MBOX, and JSON exports
- **PST Validation**: Built-in PST file integrity validation tool
- **File Information**: Quick stats and metadata display for OST/PST files
- **Real-time Progress**: Visual progress bars and detailed logging
- **Comprehensive Error Handling**: Graceful error handling with helpful messages
- **UTF-8 Support**: Full international character support throughout
- **Verbose Mode**: Optional detailed logging for troubleshooting

#### Changed
- **Complete Architecture Overhaul**: Modular design with separate components
  - Analyzer: File structure analysis
  - Converter: OST to PST conversion
  - Extractor: Email extraction to multiple formats
  - Parser: OST/PST file parsing
  - Scanner: Database scanning
  - Validator: PST file validation
  - Writer: PST file writing
- **Improved PST Generation**: Proper header structure with CRC32 checksums
- **Enhanced CLI**: Better command-line interface with Commander.js
- **Better Performance**: Optimized memory usage and processing speed
- **Improved Documentation**: Comprehensive guides and examples

#### Fixed
- **PST Header Generation**: Correct format identifiers and structure
- **Block Alignment**: Proper data structure compliance
- **CRC32 Checksums**: File integrity validation
- **Encoding Issues**: UTF-8 preservation for international content
- **Memory Leaks**: Better resource management
- **Error Handling**: More robust error recovery

#### Known Issues
- Generated PST files may not be readable by all PST readers (Outlook, XstReader)
- Internal structure conversion is incomplete (surface-level conversion only)
- OST database structures remain largely unchanged
- This is an educational/research proof-of-concept with limitations

### Technical Details

#### Architecture
```
src/
├── analyzer/     - OST/PST structure analysis
├── converter/    - OST to PST conversion logic
├── extractor/    - Email extraction (EML/MBOX/JSON)
├── parser/       - File parsing and reading
├── scanner/      - Database table scanning
├── validator/    - PST file validation
└── writer/       - PST file writing
```

#### Dependencies
- chalk ^4.1.2 - Terminal styling
- commander ^11.1.0 - CLI framework
- fs-extra ^11.1.1 - Enhanced file operations
- progress ^2.0.3 - Progress bars
- pst-extractor ^1.11.0 - PST reading

---

## [1.0.0] - 2024-12-XX

### Initial Release

#### Added
- Basic OST to PST conversion functionality
- Email extraction to EML format
- Command-line interface
- UTF-8 encoding support
- Basic error handling

#### Known Issues
- Generated PST files crashed Outlook and Thunderbird
- Incomplete header structure
- Missing CRC checksums
- Limited error handling
- No validation tools

---

## Project Goals

### Current Status (v2.0.0)
- ✅ Unified CLI interface
- ✅ Multiple export formats
- ✅ PST validation tools
- ✅ Comprehensive documentation
- ✅ Modular architecture
- ⚠️ Limited PST compatibility (educational/research use)

### Future Roadmap
- [ ] Full PST structure compliance
- [ ] Outlook compatibility
- [ ] Thunderbird compatibility
- [ ] Additional export formats (MSG, VCF)
- [ ] GUI interface
- [ ] Batch processing
- [ ] Cloud storage integration

---

## Breaking Changes

### v2.0.0 Breaking Changes
- **Command Structure**: Old scripts replaced with unified `ost2go` command
  - Old: `node extract-to-eml.js --input=file.ost`
  - New: `ost2go extract -i file.ost`
- **Installation**: Now requires global npm installation
- **Configuration**: New command-line options and structure

### Migration Guide
See [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for detailed migration instructions.

---

## Contributors

**OST2GO** is created and maintained by:
- **SkyLostTR** (@Keeftraum) - Creator and Lead Developer

---

## License

OST2GO Proprietary License - See [LICENSE](./LICENSE) for details.

**Copyright (c) 2024-2025 SkyLostTR (@Keeftraum)**

---

## Links

- **Repository**: https://github.com/SkyLostTR/OST2GO
- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions

---

*For detailed documentation, visit the [docs](./docs) directory.*
