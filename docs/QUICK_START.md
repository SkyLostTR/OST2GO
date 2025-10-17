# Quick Start Guide - OST to PST Converter

## One-Command Setup and Run

```powershell
# 1. Navigate to project
cd C:\Users\EAKTRAVIOUS\O2PT

# 2. Install dependencies (first time only)
npm install

# 3. Extract emails from OST
node extract-to-eml.js --input=NK@ON.ost --max=100 --output=my-emails
```

## Command Syntax

```powershell
node extract-to-eml.js --input=<OST-FILE> --max=<NUMBER> --output=<FOLDER> [--verbose]
```

### Parameters
- `--input=` or `-i=` → Input OST file (required)
- `--max=` → Maximum emails to extract (default: 100)
- `--output=` → Output folder name (default: extracted-emails)
- `--verbose` or `-v` → Show detailed warnings (optional)

## Common Commands

```powershell
# Extract 100 emails (clean output)
node extract-to-eml.js --input=NK@ON.ost --max=100 --output=my-emails

# Extract with detailed warnings
node extract-to-eml.js --input=NK@ON.ost --max=100 --output=my-emails --verbose

# Extract 1000 emails
node extract-to-eml.js --input=NK@ON.ost --max=1000 --output=backup

# Extract from different file
node extract-to-eml.js -i="C:\data\mailbox.ost" --max=500

# Use default output folder
node extract-to-eml.js --input=NK@ON.ost --max=200
```

## What You Get

After running the command, you'll have:

```
my-emails/
├── eml/                         # Individual email files (*.eml)
│   ├── 1_subject.eml
│   ├── 2_subject.eml
│   └── ...
├── emails.mbox                  # All emails in MBOX format
├── emails.json                  # Backup in JSON format
└── IMPORT_INSTRUCTIONS.txt      # Detailed import guide
```

## Import to Outlook (3 Steps)

1. **Open Outlook** → Navigate to target folder
2. **Drag & Drop** all `.eml` files from `my-emails/eml/` into Outlook
3. **Export to PST** → File → Open & Export → Import/Export → Export to a file → Outlook Data File (.pst)

## Troubleshooting

### "Input file not found"
```powershell
# Check file exists
Test-Path "NK@ON.ost"

# Use full path
node extract-to-eml.js --input="C:\Users\EAKTRAVIOUS\O2PT\NK@ON.ost"
```

### Skipped Attachments (Normal)
The extraction summary shows:
```
Skipped attachments: 10 (corrupt/incompatible)
```
This is **normal** - some attachments use incompatible compression. The script handles this gracefully and extracts everything else. Use `--verbose` to see which attachments were skipped.

### Out of Memory
```powershell
# Reduce batch size
node extract-to-eml.js --input=NK@ON.ost --max=50
```

### Want to See Details?
```powershell
# Use verbose mode
node extract-to-eml.js --input=NK@ON.ost --max=100 --verbose
```

## Need Help?

```powershell
# Show usage help
node extract-to-eml.js

# Read full documentation
notepad HOW_TO_RUN.md
```

## Task Runner (VS Code)

Available task: **"OST to PST Converter"**
- Press `Ctrl+Shift+B` to run
- Or: Terminal → Run Task → OST to PST Converter

---

**Quick Reference Card**
- Extract: `node extract-to-eml.js --input=file.ost --max=100`
- Import: Drag EML files to Outlook
- Convert: Export from Outlook to PST
