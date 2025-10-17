# 🚀 OST2GO - Quick Reference Card

## Installation
```bash
npm install -g .
ost2go --help
```

## Commands

### Extract Emails (Recommended)
```bash
# Extract to EML, MBOX, and JSON
ost2go extract -i file.ost -o output-dir --max 100

# With verbose output
ost2go extract -i file.ost -o output-dir --max 500 --verbose
```

### Convert OST to PST
```bash
# Real conversion (extracts actual emails)
ost2go convert -i file.ost -o file.pst --real --max-emails 100

# Legacy mode (educational only)
ost2go convert -i file.ost -o file.pst --force
```

### Validate PST File
```bash
# Basic validation
ost2go validate -i file.pst

# Verbose validation
ost2go validate -i file.pst --verbose
```

### Get File Info
```bash
ost2go info -i file.ost
```

## Quick Examples

### Extract 10 emails for testing
```bash
ost2go extract -i NK@ON.ost -o test --max 10
```

### Extract 1000 emails
```bash
ost2go extract -i NK@ON.ost -o my-emails --max 1000 --verbose
```

### Convert to PST (small batch)
```bash
ost2go convert -i NK@ON.ost -o output.pst --real --max-emails 50
```

### Check file information
```bash
ost2go info -i NK@ON.ost
```

## Common Workflows

### Workflow 1: Email Migration
```bash
# 1. Extract emails
ost2go extract -i mailbox.ost -o emails --max 1000

# 2. Import to Outlook
#    - Drag and drop .eml files from emails/eml/

# 3. Export from Outlook to PST
#    - File → Open & Export → Import/Export → Export to PST
```

### Workflow 2: Quick Conversion
```bash
# 1. Convert OST to PST
ost2go convert -i mailbox.ost -o mailbox.pst --real --max-emails 100

# 2. Validate result
ost2go validate -i mailbox.pst --verbose
```

## Options Reference

### Convert Options
- `-i, --input <path>` - Input OST file (required)
- `-o, --output <path>` - Output PST file (required)
- `--real` - Real converter mode (recommended)
- `--max-emails <n>` - Max emails to extract (default: 50)
- `--force` - Skip warnings (legacy mode)
- `--overwrite` - Overwrite existing output
- `--utf8` - UTF-8 encoding (default: true)

### Extract Options
- `-i, --input <path>` - Input OST/PST file (required)
- `-o, --output <dir>` - Output directory (default: extracted-emails)
- `--max <n>` - Max emails (default: 100)
- `--verbose` - Show detailed output

### Validate Options
- `-i, --input <path>` - PST file to validate (required)
- `--verbose` - Show detailed validation info

### Info Options
- `-i, --input <path>` - OST file to analyze (required)

## Help

```bash
# Main help
ost2go --help

# Command-specific help
ost2go convert --help
ost2go extract --help
ost2go validate --help
ost2go info --help
```

## Documentation

- **OST2GO_GUIDE.md** - Comprehensive guide
- **MIGRATION_GUIDE.md** - Migration from old commands
- **OST2GO_SUMMARY.md** - Technical summary
- **README.md** - Main documentation

## Tips

✅ **Start small** - Test with `--max 5` first
✅ **Use verbose** - Add `--verbose` when troubleshooting  
✅ **Backup first** - Keep original OST file
✅ **Validate output** - Use `validate` command
✅ **Import via Outlook** - Most reliable method

## Common Issues

### "Command not found"
```bash
npm install -g .
```

### "File not found"
Use absolute path or check current directory
```bash
ost2go info -i C:\path\to\file.ost
```

### Extraction errors
Try smaller batch size
```bash
ost2go extract -i file.ost --max 10 --verbose
```

---

**OST2GO v2.0.0** - One command, all the power! 🚀
