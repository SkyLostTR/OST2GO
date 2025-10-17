# OST2GO Website

This directory contains the GitHub Pages website for OST2GO.

## 🌐 Live Site

The website is hosted at: **https://ost2go.kief.fi**

## 📁 Structure

```
docs/
├── index.html      # Main website page
├── styles.css      # Styling and theme
├── script.js       # Interactive features
├── CNAME           # Custom domain configuration
└── README.md       # This file
```

## ✨ Features

### Homepage
- Modern hero section with gradient effects
- Feature showcase grid
- Quick start guide
- Responsive design

### Documentation
- **Usage Guide** - How to use OST2GO commands
- **Configuration** - Installation and setup
- **Commands** - Complete command reference
- **Modify & Extend** - Development guide
- **License** - Legal information

### Interactive Elements
- Smooth scrolling navigation
- Copy-to-clipboard buttons for code
- Tabbed documentation
- Mobile-responsive menu
- Scroll progress indicator
- Keyboard navigation support

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #3b82f6;
    --secondary: #8b5cf6;
    --accent: #06b6d4;
    /* ... more colors */
}
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

Website content and design © 2024-2025 SkyLostTR (@Keeftraum)

Part of the OST2GO project: https://github.com/SkyLostTR/OST2GO

## 🤝 Contributing

To improve the website:
1. Edit files in the `docs/` directory
2. Test locally before committing
3. Submit pull request with description
4. Changes will be live after merge

## 📞 Support

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions
- **Author**: @SkyLostTR on GitHub

---

# Original Documentation Files

Comprehensive guides for OST2GO

**Comprehensive guides and references for OST2GO**

*OST2GO by SkyLostTR (@Keeftraum)*  
*Repository: https://github.com/SkyLostTR/OST2GO*

---

## 📚 Documentation Index

### Quick Start
- **[QUICK_START.md](./QUICK_START.md)** - Get up and running in minutes
  - Installation
  - First commands
  - Basic usage examples

### Complete Guide
- **[OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md)** - Comprehensive documentation
  - All features explained
  - Advanced usage
  - Tips and best practices
  - Troubleshooting

### User Guide
- **[OST2GO_GUIDE.md](./OST2GO_GUIDE.md)** - Detailed user guide
  - Step-by-step tutorials
  - Common workflows
  - Real-world examples

### Command Reference
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command-line reference
  - All commands and options
  - Syntax examples
  - Quick lookup

### Migration Guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Upgrading from v1.x
  - Breaking changes
  - Migration steps
  - Compatibility notes

### Technical Documentation
- **[TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md)** - Known issues and limitations
  - What works
  - What doesn't work
  - Roadmap
  - Technical details

---

## 🚀 Getting Started

### New Users
1. Start with [QUICK_START.md](./QUICK_START.md)
2. Read [OST2GO_GUIDE.md](./OST2GO_GUIDE.md) for detailed tutorials
3. Refer to [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) as needed

### Upgrading Users
1. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for breaking changes
2. Review [OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md) for new features

### Developers
1. Read [TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md) to understand constraints
2. Review [OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md) for architecture details

---

## 📖 Documentation Structure

```
docs/
├── README.md                      # This file
├── QUICK_START.md                 # 5-minute start guide
├── OST2GO_GUIDE.md                # Detailed user guide
├── OST2GO_COMPLETE.md             # Complete documentation
├── QUICK_REFERENCE.md             # Command reference
├── MIGRATION_GUIDE.md             # v1 to v2 migration
└── TECHNICAL-LIMITATIONS.md       # Technical details
```

---

## 🔍 Find What You Need

### By Task

**I want to...**
- **Extract emails** → [QUICK_START.md](./QUICK_START.md#extract-emails)
- **Convert OST to PST** → [OST2GO_GUIDE.md](./OST2GO_GUIDE.md#convert)
- **Validate PST files** → [OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md#validate)
- **Get file info** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#info)
- **Understand limitations** → [TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md)
- **Upgrade from v1** → [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### By Experience Level

**Beginner**
- [QUICK_START.md](./QUICK_START.md) - Start here
- [OST2GO_GUIDE.md](./OST2GO_GUIDE.md) - Learn more

**Intermediate**
- [OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md) - Full reference
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Command lookup

**Advanced**
- [TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md) - Technical deep dive
- [Main README](../README.md#project-structure) - Architecture

---

## 💡 Quick Examples

### Extract 100 Emails
```bash
ost2go extract -i yourfile.ost -o my-emails --max 100
```

### Convert OST to PST
```bash
ost2go convert -i yourfile.ost -o output.pst --real --max-emails 50
```

### Get File Info
```bash
ost2go info -i yourfile.ost
```

### Validate PST
```bash
ost2go validate -i output.pst
```

For more examples, see [QUICK_START.md](./QUICK_START.md)

---

## 🆘 Getting Help

1. **Check Documentation**
   - Search this directory for your topic
   - Use the index above to find relevant guides

2. **Common Issues**
   - See [TECHNICAL-LIMITATIONS.md](./TECHNICAL-LIMITATIONS.md)
   - Check [OST2GO_COMPLETE.md](./OST2GO_COMPLETE.md#troubleshooting)

3. **Still Need Help?**
   - [GitHub Issues](https://github.com/SkyLostTR/OST2GO/issues)
   - [GitHub Discussions](https://github.com/SkyLostTR/OST2GO/discussions)

---

## 📝 Contributing to Documentation

Found an error or want to improve the docs? Contributions are welcome!

1. Fork the repository
2. Edit the relevant markdown file
3. Submit a pull request

Please maintain:
- Clear, concise language
- Working code examples
- Proper markdown formatting
- OST2GO branding

---

## 📄 License

All documentation is part of **OST2GO** and is covered by the same license.

Copyright (c) 2024-2025 SkyLostTR (@Keeftraum)  
See [LICENSE](../LICENSE) for complete terms.

---

**OST2GO** - *Making Outlook data accessible*

[Back to Main README](../README.md)
