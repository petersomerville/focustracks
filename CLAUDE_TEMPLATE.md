# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

[CUSTOMIZE: Brief description of project purpose and main technologies]

**Key Technologies**: [CUSTOMIZE: List main technologies with versions]

## Development Commands

[CUSTOMIZE: Add project-specific commands]
```bash
# Development server
npm run dev / python manage.py runserver / flask run / go run main.go

# Build/compile
npm run build / python -m build / go build

# Tests
npm test / pytest / go test

# Linting
npm run lint / flake8 / golangci-lint
```

## Version Checking Protocol

**CRITICAL**: Before starting any new feature or making architectural changes, ALWAYS check current versions of key technologies:

### Universal Discovery Commands:
```bash
# Identify project type and check common config files
ls -la | grep -E "(package\.json|requirements\.txt|Pipfile|Cargo\.toml|go\.mod|composer\.json)"

# Check for language/runtime versions
python --version 2>/dev/null || echo "Python not found"
node --version 2>/dev/null || echo "Node.js not found"
php --version 2>/dev/null || echo "PHP not found"
go version 2>/dev/null || echo "Go not found"
```

### Project-Specific Checks (customize per project):
```bash
# For JavaScript/Node.js projects:
cat package.json | grep -E "(react|next|typescript|tailwindcss)"

# For Python projects:
cat requirements.txt | head -10
cat pyproject.toml | grep -E "(python|flask|django|fastapi)" 2>/dev/null

# For Go projects:
cat go.mod | head -5

# For any project - check README for version info:
head -20 README.md | grep -i version
```

**🚨 CLAUDE CODE REMINDER**: When working on a new project or unfamiliar tech stack, ASK THE USER to customize this section with project-specific version commands and considerations.

**Current Project-Specific Considerations:**
[CUSTOMIZE: Add major version differences and gotchas for your specific tech stack]
- **[Framework] v[X]**: [Key differences from previous versions]
- **[Language] [version]**: [New features or breaking changes]

## Architecture Overview

[CUSTOMIZE: High-level architecture description]

### [Framework/Language] Architecture
- **[Component type]**: [How it's organized]
- **[State/Data management]**: [Approach used]
- **[Configuration]**: [Key config files and patterns]

## Development Guidelines

### File Organization
[CUSTOMIZE: Your project's file structure conventions]

### Code Standards
[CUSTOMIZE: Your project's coding standards and conventions]

## Project Context

[CUSTOMIZE: Any additional context about the project's purpose, learning goals, or special considerations]