# OST2GO - Build Guide

**OST2GO by SkyLostTR (@Keeftraum)**

This guide explains how to build standalone binaries for OST2GO.

## Prerequisites

- Node.js v16.0.0 or higher
- npm package manager
- Git (for cloning the repository)

## Installation

```bash
# Clone the repository
git clone https://github.com/SkyLostTR/OST2GO.git
cd OST2GO

# Install dependencies
npm install
```

## Building Binaries

### Build All Platforms at Once
```bash
npm run build:all
```

This creates binaries for:
- Windows (x64)
- Linux (x64)
- macOS (x64)

### Build Individual Platforms

#### Windows
```bash
npm run build:win
```
Output: `dist/ost2go-win-x64.exe`

#### Linux
```bash
npm run build:linux
```
Output: `dist/ost2go-linux-x64`

#### macOS
```bash
npm run build:mac
```
Output: `dist/ost2go-macos-x64`

### Build All with Default Naming
```bash
npm run build
```

## Output

Binaries are generated in the `dist/` directory:

| Platform | Filename | Approximate Size |
|----------|----------|------------------|
| Windows  | ost2go-win.exe | ~84 MB |
| Linux    | ost2go-linux | ~92 MB |
| macOS    | ost2go-macos | ~97 MB |

## What's Included

The standalone binaries include:
- Complete Node.js runtime (v18.5.0)
- All OST2GO source code
- All npm dependencies (chalk, commander, fs-extra, progress, pst-extractor)
- No external dependencies required

## Configuration

The build process is configured in `package.json`:

```json
{
  "pkg": {
    "scripts": [
      "src/**/*.js",
      "bin/**/*.js"
    ],
    "assets": [
      "node_modules/chalk/**/*",
      "node_modules/commander/**/*",
      "node_modules/fs-extra/**/*",
      "node_modules/progress/**/*",
      "node_modules/pst-extractor/**/*"
    ],
    "outputPath": "dist"
  }
}
```

## Customization

### Target Different Node.js Versions
Edit `package.json` scripts section and change `node18` to another version:
- `node16` - Node.js 16.x
- `node18` - Node.js 18.x
- `node20` - Node.js 20.x

### Add More Platforms
Available targets:
- `node18-win-x64` - Windows 64-bit
- `node18-win-arm64` - Windows ARM 64-bit
- `node18-linux-x64` - Linux 64-bit
- `node18-linux-arm64` - Linux ARM 64-bit
- `node18-macos-x64` - macOS Intel 64-bit
- `node18-macos-arm64` - macOS Apple Silicon

Example:
```bash
pkg . --targets node18-macos-arm64 --output dist/ost2go-macos-arm64
```

## Troubleshooting

### Build Fails with "Module not found"
Ensure all dependencies are listed in the `pkg.assets` section of `package.json`.

### Binary Size Too Large
- Remove unused dependencies
- Use compression tools (UPX) to reduce binary size
- Target specific platforms instead of building all

### Binary Doesn't Run
- Check platform compatibility (x64 vs ARM)
- Ensure executable permissions on Linux/macOS: `chmod +x binary-name`
- On macOS, you may need to allow the app in System Preferences > Security

## Distribution

### Windows
- Distribute `.exe` file directly
- Consider creating an installer using tools like NSIS or Inno Setup
- Code signing recommended for professional distribution

### Linux
- Distribute the binary with installation script
- Create .deb or .rpm packages for easier installation
- Add to package managers if appropriate

### macOS
- Distribute as standalone binary or create .app bundle
- Code signing required for distribution outside App Store
- Notarization required for macOS 10.15+

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build Binaries

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:all
      - uses: actions/upload-artifact@v3
        with:
          name: binaries
          path: dist/
```

## Testing Binaries

### Quick Test
```bash
# Test version
./dist/ost2go-win.exe --version

# Test help
./dist/ost2go-win.exe --help

# Test conversion (with sample file)
./dist/ost2go-win.exe convert -i sample.ost -o test.pst --real --max-emails 5
```

### Full Test Suite
```bash
# Install development dependencies
npm install

# Run tests with source code
npm test

# Run tests with binary
./dist/ost2go-win.exe extract -i sample.ost -o test-output --max 10
```

## Support

- **Repository**: https://github.com/SkyLostTR/OST2GO
- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Documentation**: https://github.com/SkyLostTR/OST2GO/tree/main/docs

## License

Proprietary - See LICENSE file

---

**OST2GO** - Node.js toolkit for converting, extracting, and managing Microsoft Outlook OST files.
