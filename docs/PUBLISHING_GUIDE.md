# OST2GO - Automated Publishing Setup Guide

**OST2GO by SkyLostTR (@Keeftraum)**

This guide explains how to set up automated publishing to npm and GitHub Packages.

## 🎯 Overview

The project includes three automated workflows:

1. **Publish Workflow** (`publish.yml`) - Automatically publishes on version changes
2. **Manual Release** (`release.yml`) - Manual control over releases
3. **Build Binaries** (`build-binaries.yml`) - Builds platform binaries on tags

## 🔧 Required Secrets

You need to configure these secrets in your GitHub repository:

### 1. NPM_TOKEN (Required for npm publishing)

**Steps to get your npm token:**

1. Log in to npm: https://www.npmjs.com/
2. Click your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** token type
5. Copy the token (starts with `npm_`)

**Add to GitHub:**
1. Go to: `https://github.com/SkyLostTR/O2PT/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Your npm token
5. Click **Add secret**

### 2. GITHUB_TOKEN (Automatic)

This is automatically provided by GitHub Actions. No setup needed!

## 📦 Publishing to GitHub Packages

### Initial Setup

1. **Update package.json** (for scoped packages):
```json
{
  "name": "@skylosttr/ost2go",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

2. **Authenticate users** (for installation):

Create `.npmrc` file:
```
@skylosttr:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Users install with:
```bash
npm install @skylosttr/ost2go
```

## 🚀 How It Works

### Automatic Publishing (publish.yml)

**Triggers:**
- When `package.json` is pushed to `main` branch
- Version number has changed
- Tag doesn't already exist

**What it does:**
1. ✅ Detects version change in package.json
2. ✅ Runs tests
3. ✅ Builds binaries for Windows, Linux, macOS
4. ✅ Generates SHA256 checksums
5. ✅ Creates Git tag (e.g., `v2.1.0`)
6. ✅ Creates GitHub Release with binaries
7. ✅ Publishes to npm
8. ✅ Publishes to GitHub Packages

**Workflow:**
```bash
# Update version
npm version 2.2.0 --no-git-tag-version

# Update CHANGELOG.md with new version section

# Commit and push
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 2.2.0"
git push origin main

# GitHub Actions automatically:
# - Creates tag v2.2.0
# - Builds binaries
# - Publishes to npm and GitHub Packages
# - Creates GitHub Release
```

### Manual Release (release.yml)

**Trigger:** Manual via GitHub Actions UI

**Use cases:**
- Full control over what gets published
- Testing before publishing
- Pre-releases
- Selective publishing (only npm, only GitHub Packages, etc.)

**How to use:**
1. Go to: `https://github.com/SkyLostTR/O2PT/actions/workflows/release.yml`
2. Click **Run workflow**
3. Fill in options:
   - **Version**: e.g., `2.2.0` or `2.2.0-beta.1`
   - **Publish to npm**: ✅ (default: true)
   - **Publish to GitHub Packages**: ✅ (default: true)
   - **Create GitHub Release**: ✅ (default: true)
   - **Build binaries**: ✅ (default: true)
   - **Pre-release**: ☐ (check for beta/alpha releases)
4. Click **Run workflow**

### Build Binaries Only (build-binaries.yml)

**Triggers:**
- When a tag is pushed (e.g., `v2.1.0`)
- Manual via GitHub Actions UI

**What it does:**
- Builds binaries on native platforms (faster, more reliable)
- Generates checksums
- Attaches to GitHub Release

## 📝 Version Management Best Practices

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (2.0.0 → 2.1.0): New features, backward compatible
- **PATCH** (2.1.0 → 2.1.1): Bug fixes

### npm Commands

```bash
# Patch release (2.1.0 → 2.1.1)
npm version patch

# Minor release (2.1.0 → 2.2.0)
npm version minor

# Major release (2.1.0 → 3.0.0)
npm version major

# Pre-release (2.1.0 → 2.1.1-beta.0)
npm version prepatch --preid=beta

# Specific version
npm version 2.2.0
```

**Note:** Use `--no-git-tag-version` flag to update package.json without creating a tag:
```bash
npm version 2.2.0 --no-git-tag-version
```

### Changelog Management

Always update `CHANGELOG.md` before releasing:

```markdown
## [2.2.0] - 2025-10-20

### Added
- New feature X
- New feature Y

### Changed
- Updated component Z

### Fixed
- Bug fix for issue #123

### Security
- Security update for dependency ABC
```

## 🔄 Release Workflow

### Standard Release

```bash
# 1. Create new version section in CHANGELOG.md
# Add details about changes in this release

# 2. Update version in package.json
npm version 2.2.0 --no-git-tag-version

# 3. Commit changes
git add package.json CHANGELOG.md
git commit -m "chore: release v2.2.0"

# 4. Push to main
git push origin main

# 5. GitHub Actions automatically handles the rest!
```

### Pre-release (Beta/Alpha)

```bash
# 1. Update CHANGELOG.md with pre-release section
## [2.2.0-beta.1] - 2025-10-20

# 2. Update version
npm version 2.2.0-beta.1 --no-git-tag-version

# 3. Commit and push
git add package.json CHANGELOG.md
git commit -m "chore: release v2.2.0-beta.1"
git push origin main

# 4. OR use Manual Release workflow with "Pre-release" checked
```

### Hotfix Release

```bash
# 1. Create hotfix branch
git checkout -b hotfix/2.1.1

# 2. Fix the bug
# ... make changes ...

# 3. Update CHANGELOG.md
## [2.1.1] - 2025-10-20
### Fixed
- Critical bug fix

# 4. Update version
npm version patch --no-git-tag-version

# 5. Commit and merge to main
git add .
git commit -m "fix: critical bug in converter"
git checkout main
git merge hotfix/2.1.1
git push origin main

# 6. Auto-publish triggers
```

## 🧪 Testing Before Publishing

### Local Testing

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build binaries
npm run build:all

# Test local installation
npm pack
npm install -g ost2go-2.1.0.tgz
ost2go --version
```

### Test Publishing (Dry Run)

```bash
# Test npm publish without actually publishing
npm publish --dry-run

# Check what files will be included
npm pack --dry-run
```

## 🔍 Monitoring Releases

### Check Workflow Status

1. Go to: `https://github.com/SkyLostTR/O2PT/actions`
2. Click on the running workflow
3. View logs for each step

### Verify Published Packages

**npm:**
```bash
# Check if version is published
npm view ost2go versions

# Check latest version
npm view ost2go version

# Install and test
npm install -g ost2go@latest
ost2go --version
```

**GitHub Packages:**
```bash
# View package
# https://github.com/SkyLostTR/O2PT/packages

# Install from GitHub Packages
npm install @skylosttr/ost2go
```

**GitHub Releases:**
- Visit: `https://github.com/SkyLostTR/O2PT/releases`
- Check that binaries are attached
- Verify checksums

## 🐛 Troubleshooting

### Workflow Fails

**Common issues:**

1. **NPM_TOKEN not set or invalid**
   ```
   Error: Unable to authenticate
   ```
   - Verify token in GitHub Secrets
   - Check token hasn't expired
   - Regenerate if needed

2. **Version already published**
   ```
   Error: You cannot publish over the previously published versions
   ```
   - Bump version number
   - Check npm registry: `npm view ost2go versions`

3. **Tag already exists**
   ```
   Error: tag 'v2.1.0' already exists
   ```
   - Workflow skips automatically
   - Delete tag if needed: `git push --delete origin v2.1.0`

4. **Tests fail**
   - Workflow continues (set to `continue-on-error: true`)
   - Fix tests before next release

5. **Binary build fails**
   - Check pkg compatibility
   - Review dependencies
   - Use Manual Release to skip binary building

### Rollback a Release

```bash
# 1. Deprecate npm version
npm deprecate ost2go@2.2.0 "This version has issues, please use 2.1.0"

# 2. Delete GitHub release (optional)
# Go to releases page and delete

# 3. Delete tag
git tag -d v2.2.0
git push --delete origin v2.2.0

# 4. Publish fixed version
npm version 2.2.1 --no-git-tag-version
# ... update changelog ...
git commit -am "fix: release v2.2.1"
git push
```

## 📊 Workflow Comparison

| Feature | Publish | Manual Release | Build Binaries |
|---------|---------|----------------|----------------|
| **Trigger** | Auto (version change) | Manual | Tag or Manual |
| **Build Binaries** | ✅ | ✅ Optional | ✅ |
| **Publish npm** | ✅ | ✅ Optional | ❌ |
| **Publish GitHub** | ✅ | ✅ Optional | ❌ |
| **Create Release** | ✅ | ✅ Optional | ✅ |
| **Full Control** | ❌ | ✅ | ❌ |
| **Best For** | Regular releases | Testing, Pre-releases | Binary updates |

## 🎯 Recommended Workflow

For most releases, use the **automatic workflow**:

1. ✅ Update `CHANGELOG.md` with release notes
2. ✅ Bump version: `npm version [major|minor|patch] --no-git-tag-version`
3. ✅ Commit: `git commit -am "chore: release vX.Y.Z"`
4. ✅ Push: `git push origin main`
5. ✅ Watch GitHub Actions do the rest!

For pre-releases or testing, use **Manual Release** workflow.

## 📚 Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## 🆘 Support

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions

---

**OST2GO** - Node.js toolkit for converting, extracting, and managing Microsoft Outlook OST files.

**Author**: SkyLostTR (@Keeftraum)
**Repository**: https://github.com/SkyLostTR/OST2GO
