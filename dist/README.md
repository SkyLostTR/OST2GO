# OST2GO - Standalone Binaries

**OST2GO by SkyLostTR (@Keeftraum)**

These are standalone executable binaries for OST2GO that don't require Node.js to be installed.

## Available Binaries

- **ost2go-win.exe** - Windows (x64)
- **ost2go-linux** - Linux (x64)
- **ost2go-macos** - macOS (x64)

## Installation

### Windows
1. Download `ost2go-win.exe`
2. Place it in a directory of your choice
3. (Optional) Add the directory to your PATH environment variable
4. Run from Command Prompt or PowerShell: `.\ost2go-win.exe --help`

### Linux
1. Download `ost2go-linux`
2. Make it executable: `chmod +x ost2go-linux`
3. (Optional) Move to `/usr/local/bin/` or add to PATH
4. Run: `./ost2go-linux --help`

### macOS
1. Download `ost2go-macos`
2. Make it executable: `chmod +x ost2go-macos`
3. (Optional) Move to `/usr/local/bin/` or add to PATH
4. Run: `./ost2go-macos --help`

## Usage Examples

### Convert OST to PST
```bash
# Windows
.\ost2go-win.exe convert -i yourfile.ost -o output.pst --real --max-emails 100

# Linux/macOS
./ost2go-linux convert -i yourfile.ost -o output.pst --real --max-emails 100
```

### Extract Emails
```bash
# Windows
.\ost2go-win.exe extract -i yourfile.ost -o emails_folder --format eml --max 50

# Linux/macOS
./ost2go-linux extract -i yourfile.ost -o emails_folder --format eml --max 50
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

## Available Commands

- `convert` - Convert OST to PST format
- `extract` - Extract emails from OST file
- `info` - Display OST file information
- `validate` - Validate PST file structure

Run any command with `--help` for detailed options:
```bash
.\ost2go-win.exe convert --help
```

## Requirements

- **No Node.js installation required!**
- Sufficient disk space for output files
- Read permissions for input OST files

## Support

- **Repository**: https://github.com/SkyLostTR/OST2GO
- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Author**: SkyLostTR (@Keeftraum)

## License

Proprietary - See LICENSE file in the main repository

---

**OST2GO** - Node.js toolkit for converting, extracting, and managing Microsoft Outlook OST files.
