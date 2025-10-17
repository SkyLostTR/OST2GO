# 🔄 Migration Guide - Old Commands to OST2GO

This guide helps you migrate from the old command structure to the new unified `ost2go` command.

## Installation

### Old Way
```bash
# No global installation
node src/index.js ...
node extract-to-eml.js ...
```

### New Way
```bash
# Install globally
npm install -g .

# Now use from anywhere
ost2go <subcommand> [options]
```

---

## Command Migrations

### Extract Emails

**Old Command:**
```bash
node extract-to-eml.js --input=your-ost-file.ost --max=100 --output=my-emails --verbose
```

**New Command:**
```bash
ost2go extract -i your-ost-file.ost --max 100 -o my-emails --verbose
```

**Changes:**
- Use `ost2go extract` subcommand
- `--input=` becomes `-i`
- `--output=` becomes `-o`
- `--max=` becomes `--max` (space instead of `=`)

---

### Convert OST to PST (Real Mode)

**Old Command:**
```bash
node src/index.js convert -i input.ost -o output.pst --real --max-emails 50
```

**New Command:**
```bash
ost2go convert -i input.ost -o output.pst --real --max-emails 50
```

**Changes:**
- Replace `node src/index.js convert` with `ost2go convert`
- All options remain the same

---

### Convert OST to PST (Legacy Mode)

**Old Command:**
```bash
node src/index.js convert -i input.ost -o output.pst --force
```

**New Command:**
```bash
ost2go convert -i input.ost -o output.pst --force
```

**Changes:**
- Replace `node src/index.js convert` with `ost2go convert`
- All options remain the same

---

### Validate PST Files

**Old Command:**
```bash
node src/index.js validate -i output.pst --verbose
```

**New Command:**
```bash
ost2go validate -i output.pst --verbose
```

**Changes:**
- Replace `node src/index.js validate` with `ost2go validate`
- All options remain the same

---

### Get File Information

**Old Command:**
```bash
node src/index.js info -i input.ost
```

**New Command:**
```bash
ost2go info -i input.ost
```

**Changes:**
- Replace `node src/index.js info` with `ost2go info`
- All options remain the same

---

## Quick Reference Table

| Old Command | New Command |
|-------------|-------------|
| `node extract-to-eml.js --input=file.ost` | `ost2go extract -i file.ost` |
| `node src/index.js convert -i file.ost -o file.pst` | `ost2go convert -i file.ost -o file.pst` |
| `node src/index.js validate -i file.pst` | `ost2go validate -i file.pst` |
| `node src/index.js info -i file.ost` | `ost2go info -i file.ost` |

---

## Benefits of New Structure

✅ **Single Unified Command**: No more remembering multiple script names
✅ **Global Installation**: Use `ost2go` from any directory
✅ **Consistent Interface**: All subcommands follow the same pattern
✅ **Better Help**: `ost2go --help` and `ost2go <subcommand> --help`
✅ **Professional CLI**: Industry-standard command structure
✅ **Easier to Remember**: Logical subcommand names

---

## Testing the Migration

### 1. Install Globally
```bash
npm install -g .
```

### 2. Verify Installation
```bash
ost2go --help
```

### 3. Test Each Command
```bash
# Test extract
ost2go extract -i your-ost-file.ost -o test --max 5

# Test info
ost2go info -i your-ost-file.ost

# Test validate (if you have a PST file)
ost2go validate -i output.pst
```

---

## Backward Compatibility

The old commands still work if you prefer:
```bash
# These still work
node src/index.js convert -i file.ost -o file.pst
node extract-to-eml.js --input=file.ost
```

However, we recommend migrating to the new `ost2go` command for:
- Better consistency
- Global availability
- Improved user experience

---

## Need Help?

- **Main Guide**: See [OST2GO_GUIDE.md](./OST2GO_GUIDE.md)
- **Command Help**: Run `ost2go <subcommand> --help`
- **Examples**: Check [README.md](./README.md)

---

**OST2GO v2.0.0** - Unified, Simple, Powerful! 🚀
