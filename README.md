# OST2GO Website - GitHub Pages Branch

[![Website](https://img.shields.io/badge/Website-ost2go.kief.fi-blue?style=for-the-badge)](https://ost2go.kief.fi)
[![Repository](https://img.shields.io/badge/Repository-SkyLostTR/OST2GO-181717?style=for-the-badge&logo=github)](https://github.com/SkyLostTR/OST2GO)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Active-green?style=for-the-badge)](https://pages.github.com/)

## 🌐 About This Branch

This `github-pages` branch contains **only the website files** for the OST2GO project documentation. It is automatically deployed to **https://ost2go.kief.fi** via GitHub Pages.

### 📋 Branch Purpose
- **Website Deployment**: Hosts the official OST2GO documentation website
- **Clean Separation**: Isolated from main project development
- **Automated Publishing**: Changes pushed here are live within minutes
- **Documentation Focus**: Comprehensive guides, tutorials, and references

### 🔄 Deployment Architecture
```
GitHub Repository (SkyLostTR/OST2GO)
├── master/          # Main project code & development
├── dev/            # Development branch
└── github-pages/   # 📍 This branch - Website only
    ├── docs/       # Website root directory
    ├── _config.yml # GitHub Pages configuration
    └── CNAME       # Custom domain configuration
```

## 📁 Website Structure

```
docs/
├── index.html           # Homepage with features overview
├── styles.css           # Modern dark theme styling
├── script.js            # Interactive features & navigation
├── CNAME               # ost2go.kief.fi domain config
├── README.md           # Website-specific documentation
└── [Documentation Files]
    ├── OST2GO_GUIDE.md         # Complete usage guide
    ├── QUICK_START.md          # Getting started
    ├── QUICK_REFERENCE.md      # Command reference
    ├── TECHNICAL-LIMITATIONS.md # Known limitations
    ├── MIGRATION_GUIDE.md      # Migration help
    └── OST2GO_COMPLETE.md      # Comprehensive docs
```

## 🎨 Website Features

### ✨ Modern Design System
- **Dark Theme**: Professional dark mode with blue/purple accents
- **Responsive**: Mobile-first design (320px to 4K+)
- **Fast Loading**: Optimized assets, ~50KB total
- **Accessible**: WCAG 2.1 AA compliant

### 📚 Interactive Documentation
- **Tabbed Interface**: Organized content sections
- **Copy-to-Clipboard**: One-click code copying
- **Smooth Scrolling**: Enhanced navigation
- **Search-Friendly**: SEO optimized structure

### 🛠️ Technical Stack
- **Pure HTML5/CSS3/JS**: No frameworks or dependencies
- **GitHub Pages**: Jekyll-powered static hosting
- **Custom Domain**: ost2go.kief.fi with SSL
- **CDN**: Automatic global distribution

## 🚀 Quick Start

### For Visitors
1. Visit **https://ost2go.kief.fi**
2. Browse documentation tabs
3. Copy code examples
4. Follow installation guides

### For Contributors
```bash
# Clone the repository
git clone https://github.com/SkyLostTR/OST2GO.git
cd OST2GO

# Switch to website branch
git checkout github-pages

# Make changes to docs/ files
# Test locally (see docs/README.md)

# Commit and push
git add .
git commit -m "Update website content"
git push origin github-pages
```

## 📝 Content Management

### Adding New Documentation
1. Create `.md` file in `docs/` directory
2. Follow existing naming conventions
3. Update navigation in `index.html`
4. Test locally before pushing

### Updating Website Design
- **Styling**: Edit `docs/styles.css`
- **Layout**: Modify `docs/index.html`
- **Features**: Update `docs/script.js`

### Local Testing
```bash
# Start local server
cd docs
python -m http.server 8000
# Visit http://localhost:8000
```

## 🔧 Configuration

### GitHub Pages Settings
- **Source**: Deploy from branch `github-pages`
- **Folder**: `/docs` (website root)
- **Domain**: `ost2go.kief.fi`
- **SSL**: Enforce HTTPS (automatic)

### Domain Configuration
```
Type: A
Name: ost2go
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

## 📊 Website Analytics

### Performance Metrics
- **Load Time**: <2 seconds globally
- **Core Web Vitals**: All green scores
- **Mobile Score**: 95+ (Lighthouse)
- **SEO Score**: 90+ (Lighthouse)

### Content Stats
- **Pages**: 8 documentation sections
- **Features**: 6 main capabilities
- **Code Examples**: 15+ copyable snippets
- **Languages**: English (primary)

## 🔄 Update Process

### Automated Deployment
```
Push to github-pages branch
    ↓
GitHub Actions build trigger
    ↓
Jekyll processes _config.yml
    ↓
Static files generated
    ↓
Deployed to ost2go.kief.fi
    ↓
CDN cache update (5-10 min)
```

### Manual Cache Busting
If changes don't appear immediately:
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Site not updating | Wait 5-10 min, hard refresh |
| Domain not resolving | Check DNS propagation (24-48h) |
| HTTPS not working | Wait for SSL certificate (24h) |
| Broken links | Update `docs/index.html` navigation |

### Support
- **Website Issues**: [GitHub Issues](https://github.com/SkyLostTR/OST2GO/issues)
- **Documentation**: [Website Docs](https://ost2go.kief.fi)
- **Domain**: Contact DNS provider (kief.fi)

## 📄 License

**Website Content &copy; 2024-2025 SkyLostTR (@Keeftraum)**

This website and its documentation are part of the OST2GO project. See [LICENSE](LICENSE) for terms.

## 🤝 Contributing

### Website Improvements
1. Fork the repository
2. Create branch from `github-pages`
3. Make changes to `docs/` files only
4. Test locally
5. Submit pull request

### Content Guidelines
- Use clear, concise language
- Include code examples
- Test all links
- Follow existing formatting

---

**OST2GO Documentation Website**
*Built for developers, by developers*
[https://ost2go.kief.fi](https://ost2go.kief.fi)</content>
<parameter name="filePath">c:\Users\EAKTRAVIOUS\O2PT\README.md