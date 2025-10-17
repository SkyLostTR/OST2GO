# OST2GO - GitHub Repository Setup Guide

**OST2GO by SkyLostTR (@Keeftraum)**

This guide helps you configure your GitHub repository for automated publishing.

## 🔧 Repository Settings

### 1. Enable GitHub Actions

1. Go to: `https://github.com/SkyLostTR/O2PT/settings/actions`
2. Under **Actions permissions**, select:
   - ✅ **Allow all actions and reusable workflows**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

### 2. Add NPM_TOKEN Secret

#### Get NPM Token:
1. Go to: https://www.npmjs.com/
2. Log in to your account
3. Click your profile picture → **Access Tokens**
4. Click **Generate New Token** → **Classic Token**
5. Select **Automation** type
6. Copy the token (starts with `npm_`)

#### Add to GitHub:
1. Go to: `https://github.com/SkyLostTR/O2PT/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click **Add secret**

### 3. Configure GitHub Packages (Optional)

If you want to publish to GitHub Packages as a scoped package:

1. **No additional secrets needed** - `GITHUB_TOKEN` is automatic
2. Users will install with: `npm install @skylosttr/ost2go`

### 4. Branch Protection (Recommended)

Protect your main branch:

1. Go to: `https://github.com/SkyLostTR/O2PT/settings/branches`
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
5. Click **Create**

### 5. Enable Discussions (Optional)

For community feedback:

1. Go to: `https://github.com/SkyLostTR/O2PT/settings`
2. Scroll to **Features**
3. Check ✅ **Discussions**
4. Click **Set up discussions**

### 6. Configure Releases

1. Go to: `https://github.com/SkyLostTR/O2PT/releases`
2. Releases will be created automatically by workflows
3. You can also create manual releases

## 📋 Workflow Files

Your repository should have these workflow files:

```
.github/
└── workflows/
    ├── publish.yml         # Automatic publish on version change
    ├── release.yml         # Manual release workflow
    └── build-binaries.yml  # Build platform binaries
```

## 🧪 Testing Workflows

### Test Without Publishing

1. **Fork the repository** (if you want to test safely)
2. **Remove npm publish step** temporarily:
   - Comment out the "Publish to npm" step in workflows
3. **Push a version change** to trigger workflow
4. **Check Actions tab** to see if workflow completes
5. **Restore publish step** when ready

### Dry Run

Use the Manual Release workflow:
1. Go to: `https://github.com/SkyLostTR/O2PT/actions/workflows/release.yml`
2. Click **Run workflow**
3. **Uncheck** "Publish to npm"
4. **Uncheck** "Publish to GitHub Packages"
5. **Check** "Create GitHub Release" (to test release creation)
6. Click **Run workflow**

## 📊 Monitoring

### Check Workflow Status

1. Go to: `https://github.com/SkyLostTR/O2PT/actions`
2. Click on any workflow run
3. View logs for each step
4. Check for errors or warnings

### Check Published Packages

**npm:**
```bash
npm view ost2go
npm view ost2go versions
```

**GitHub Packages:**
- Visit: `https://github.com/SkyLostTR/O2PT/packages`

**GitHub Releases:**
- Visit: `https://github.com/SkyLostTR/O2PT/releases`

## 🔐 Security Best Practices

### Protect Your Tokens

1. ✅ **Never commit tokens** to repository
2. ✅ **Use GitHub Secrets** for sensitive data
3. ✅ **Rotate tokens regularly** (every 90 days)
4. ✅ **Use automation tokens** (not personal tokens)
5. ✅ **Limit token permissions** (only what's needed)

### Token Permissions

**NPM_TOKEN should have:**
- ✅ Publish packages
- ✅ Access public packages
- ❌ No admin access needed
- ❌ No private package access needed

**GITHUB_TOKEN automatically has:**
- ✅ Read repository
- ✅ Write releases
- ✅ Write packages
- ✅ Read/write contents

## 🚨 Troubleshooting

### Workflow Not Triggering

**Check:**
1. ✅ Workflow file syntax is correct (YAML)
2. ✅ Branch name matches trigger (`main`)
3. ✅ Actions are enabled in repository settings
4. ✅ File path matches trigger (`package.json`)

### NPM Publish Fails

**Common causes:**
1. ❌ NPM_TOKEN not set or expired
2. ❌ Package name already taken
3. ❌ Version already published
4. ❌ Package is private but trying to publish as public

**Solutions:**
```bash
# Check if package name is available
npm view ost2go

# Check your npm login status
npm whoami

# Verify token is valid
npm token list

# Check package.json is valid
npm pack --dry-run
```

### GitHub Packages Publish Fails

**Common causes:**
1. ❌ Package name not scoped (`@skylosttr/ost2go`)
2. ❌ Registry not set in package.json
3. ❌ Token doesn't have packages:write permission

**Solutions:**
- Ensure package name is scoped: `@skylosttr/ost2go`
- Add publishConfig to package.json
- Check workflow has `packages: write` permission

### Binary Build Fails

**Common causes:**
1. ❌ pkg version incompatible with Node.js version
2. ❌ Native dependencies in packages
3. ❌ Insufficient disk space in runner

**Solutions:**
- Use `continue-on-error: true` for binary builds
- Test builds locally first
- Update pkg to latest version

## 🔄 Updating Workflows

### Modify Workflow Files

1. Edit `.github/workflows/*.yml` files
2. Commit changes
3. Push to main branch
4. Workflows update automatically

### Best Practices

1. ✅ **Test locally** before pushing workflow changes
2. ✅ **Use semantic versioning** for releases
3. ✅ **Keep secrets updated** and secure
4. ✅ **Monitor workflow runs** regularly
5. ✅ **Document changes** in CHANGELOG.md

## 📞 Getting Help

### Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **npm Publishing Guide**: https://docs.npmjs.com/cli/v9/commands/npm-publish
- **GitHub Packages Documentation**: https://docs.github.com/en/packages
- **pkg Documentation**: https://github.com/vercel/pkg

### Support Channels

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions
- **Documentation**: `docs/PUBLISHING_GUIDE.md`

## ✅ Checklist

Before going live with automated publishing:

- [ ] NPM_TOKEN added to GitHub Secrets
- [ ] GitHub Actions enabled with write permissions
- [ ] Workflow files are in `.github/workflows/`
- [ ] package.json has correct name and version
- [ ] CHANGELOG.md is updated
- [ ] .npmignore is configured
- [ ] README.md has installation instructions
- [ ] Test workflow on a test branch/fork
- [ ] Verify npm package name is available
- [ ] Branch protection configured (optional)
- [ ] All tests pass locally

---

**OST2GO** - Node.js toolkit for converting, extracting, and managing Microsoft Outlook OST files.

**Author**: SkyLostTR (@Keeftraum)
**Repository**: https://github.com/SkyLostTR/OST2GO
