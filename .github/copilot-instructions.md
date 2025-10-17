# OST2GO - GitHub Copilot Instructions<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

## Project Overview

- [x] Clarify Project Requirements

**OST2GO** is a Node.js toolkit for converting, extracting, and managing Microsoft Outlook OST files.	<!-- Node.js project for converting Microsoft Outlook OST files to PST format with UTF-8 support -->



- **Author**: SkyLostTR (@Keeftraum)- [x] Scaffold the Project

- **Version**: 2.0.0	<!-- Project structure created with package.json, source files, converter logic, tests, and documentation -->

- **License**: Proprietary (See LICENSE file)

- **Repository**: https://github.com/SkyLostTR/OST2GO- [x] Customize the Project

	<!-- Project customized with OST to PST conversion logic, UTF-8 support, CLI interface, and comprehensive error handling -->

## Project Status

- [x] Install Required Extensions

✅ **COMPLETE** - All core features implemented and tested	<!-- No extensions needed for this Node.js project -->



### Completed Tasks- [x] Compile the Project

	<!--

- ✅ Unified CLI interface with `ost2go` command	Verify that all previous steps have been completed.

- ✅ OST to PST conversion (real & legacy modes)	Install any missing dependencies.

- ✅ Email extraction (EML, MBOX, JSON formats)	Run diagnostics and resolve any issues.

- ✅ PST file validation	Check for markdown files in project folder for relevant instructions on how to do this.

- ✅ File information display	NOTE: Node.js v22.20.0 installed via NVM, dependencies installed successfully, all tests passed.

- ✅ Comprehensive documentation	-->

- ✅ Project structure organization

- ✅ License and copyright protection- [ ] Create and Run Task

- ✅ Changelog and versioning	<!--

	Verify that all previous steps have been completed.

## Architecture	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.

	Skip this step otherwise.

```	 -->

src/

├── analyzer/     - OST/PST file analysis- [ ] Launch the Project

├── converter/    - OST to PST conversion logic	<!--

├── extractor/    - Email extraction (EML/MBOX/JSON)	Verify that all previous steps have been completed.

├── parser/       - File parsing and reading	Prompt user for debug mode, launch only if confirmed.

├── scanner/      - Database table scanning	 -->

├── validator/    - PST file validation

└── writer/       - PST file writing- [ ] Ensure Documentation is Complete

```	<!--

	Verify that all previous steps have been completed.

## Coding Standards	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.

	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.

### Branding	 -->
- Always include "OST2GO by SkyLostTR (@Keeftraum)" in user-facing messages
- Reference https://github.com/SkyLostTR/OST2GO in documentation
- Maintain copyright notices in all source files

### File Headers
```javascript
/**
 * OST2GO - [Module Name]
 * 
 * [Brief description]
 * 
 * @author SkyLostTR (@Keeftraum)
 * @license SEE LICENSE IN LICENSE
 * @repository https://github.com/SkyLostTR/OST2GO
 */
```

### Code Style
- Use clear, descriptive variable names
- Add comments for complex logic
- Handle errors gracefully with user-friendly messages
- Use chalk for colored terminal output
- Show progress bars for long operations

### Security
- Never hardcode sensitive information (file paths, emails, personal data)
- Use placeholder examples: `yourfile.ost`, `example.ost`
- Keep user data private and secure

## Testing

```bash
# Run tests
npm test

# Test CLI commands
ost2go extract -i yourfile.ost -o test --max 10
ost2go convert -i yourfile.ost -o output.pst --real --max-emails 5
ost2go info -i yourfile.ost
ost2go validate -i output.pst
```

## Known Limitations

- Generated PST files may not be compatible with all email clients
- This is an educational/research tool, not production-ready
- OST structure conversion is incomplete (surface-level only)

## Documentation Structure

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `LICENSE` - Proprietary license terms
- `docs/` - Detailed guides and references
- `tools/` - Utility scripts

## Development Guidelines

1. **Maintain Branding**: Always credit SkyLostTR (@Keeftraum)
2. **Follow License**: Respect proprietary license terms
3. **Document Changes**: Update CHANGELOG.md for significant changes
4. **Test Thoroughly**: Verify changes with real OST files
5. **User Experience**: Clear messages, progress indicators, error handling

## Support

- **Issues**: https://github.com/SkyLostTR/OST2GO/issues
- **Discussions**: https://github.com/SkyLostTR/OST2GO/discussions
- **Author**: @SkyLostTR on GitHub
