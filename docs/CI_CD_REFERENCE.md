# OST2GO - CI/CD Quick Reference

**OST2GO by SkyLostTR (@Keeftraum)**

## 🚀 Quick Release Commands

### Standard Release
```bash
# 1. Update CHANGELOG.md (add new version section)
# 2. Bump version
npm version 2.2.0 --no-git-tag-version

# 3. Commit and push (triggers auto-publish)
git add package.json CHANGELOG.md
git commit -m "chore: release v2.2.0"
git push origin main
```

### Patch Release (Bug Fix)
```bash
npm version patch --no-git-tag-version
# Updates: 2.1.0 → 2.1.1
```

### Minor Release (New Features)
```bash
npm version minor --no-git-tag-version
# Updates: 2.1.0 → 2.2.0
```

### Major Release (Breaking Changes)
```bash
npm version major --no-git-tag-version
# Updates: 2.1.0 → 3.0.0
```

### Pre-release
```bash
npm version 2.2.0-beta.1 --no-git-tag-version
# Then use Manual Release workflow with "Pre-release" checked
```

## 🔄 Workflows

### 1. Automatic Publish (`publish.yml`)
**Triggers:** Push to `main` with `package.json` version change

**Does:**
- ✅ Runs tests
- ✅ Builds binaries
- ✅ Creates GitHub Release
- ✅ Publishes to npm
- ✅ Publishes to GitHub Packages

### 2. Manual Release (`release.yml`)
**Trigger:** GitHub Actions → Workflows → Manual Release → Run workflow

**Options:**
- Version number
- Publish to npm (yes/no)
- Publish to GitHub Packages (yes/no)
- Create GitHub Release (yes/no)
- Build binaries (yes/no)
- Mark as pre-release (yes/no)

### 3. Build Binaries (`build-binaries.yml`)
**Triggers:** Git tag push OR manual

**Does:**
- ✅ Builds Windows/Linux/macOS binaries
- ✅ Generates checksums
- ✅ Attaches to release

## 🔑 Required Secrets

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `NPM_TOKEN` | npm automation token | npmjs.com → Access Tokens |
| `GITHUB_TOKEN` | Auto-provided | No setup needed |

### Add NPM_TOKEN:
1. Go to: `Settings → Secrets → Actions → New repository secret`
2. Name: `NPM_TOKEN`
3. Value: Your npm token (from npmjs.com)

## 📝 CHANGELOG.md Format

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security updates
```

## 🧪 Testing Locally

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build binaries
npm run build:all

# Test package
npm pack
npm install -g ost2go-X.Y.Z.tgz
ost2go --version

# Dry run publish
npm publish --dry-run
```

## 🔍 Verify Published

### npm
```bash
npm view ost2go versions
npm view ost2go version
npm install -g ost2go@latest
ost2go --version
```

### GitHub Packages
```bash
# Install
npm install @skylosttr/ost2go

# View online
# https://github.com/SkyLostTR/O2PT/packages
```

### GitHub Releases
```
https://github.com/SkyLostTR/O2PT/releases
```

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Version already published | Bump version number |
| NPM_TOKEN invalid | Regenerate token on npmjs.com |
| Tag already exists | Delete tag: `git push --delete origin vX.Y.Z` |
| Tests fail | Fix tests (workflow continues anyway) |
| Binary build fails | Use Manual Release, uncheck "Build binaries" |

## 🔄 Rollback

```bash
# Deprecate on npm
npm deprecate ost2go@X.Y.Z "Use version X.Y.W instead"

# Delete tag
git tag -d vX.Y.Z
git push --delete origin vX.Y.Z

# Publish fixed version
npm version X.Y.W --no-git-tag-version
git commit -am "fix: release vX.Y.W"
git push origin main
```

## 📊 Workflow Status

Check: `https://github.com/SkyLostTR/O2PT/actions`

## 🎯 Best Practices

1. ✅ Always update `CHANGELOG.md` before releasing
2. ✅ Use semantic versioning
3. ✅ Test locally before pushing
4. ✅ Use meaningful commit messages
5. ✅ Monitor workflow logs
6. ✅ Verify package after publishing

## 📞 Support

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Documentation**: `docs/PUBLISHING_GUIDE.md`

---

**OST2GO by SkyLostTR (@Keeftraum)**
