# Pull Request

## Description
<!-- Brief description of what this PR accomplishes -->

## Type of Change
<!-- Mark the relevant option with an 'x' -->
- [ ] Feature (feat:) - New functionality
- [ ] Bug Fix (fix:) - Fixes an issue
- [ ] Refactor (refactor:) - Code restructuring without behavior change
- [ ] Documentation (docs:) - Documentation updates
- [ ] Tests (test:) - Adding or updating tests
- [ ] Chore (chore:) - Build scripts, dependencies, config

## Quality Checklist
<!-- All items must be checked before requesting review -->
- [ ] Tests added/updated and passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Conventional commit format used in commit messages
- [ ] No console.log or debugging code left in files
- [ ] Error handling includes user-friendly messages
- [ ] TypeScript types properly defined (no `any` unless justified)

## Accessibility Checklist
<!-- Required for any UI changes -->
- [ ] All form inputs have associated labels (htmlFor/id)
- [ ] ARIA attributes added where appropriate
- [ ] Keyboard navigation tested
- [ ] Tests use `getByLabelText` instead of `getByPlaceholderText`
- [ ] Color contrast meets WCAG AA standards

## Authentication & Database Checklist
<!-- Required for API routes or database changes -->
- [ ] Service role vs anonymous key usage documented
- [ ] RLS policies tested with non-admin user
- [ ] Admin operations verify user role before executing
- [ ] No service role key usage without admin verification
- [ ] Database migrations included (if schema changed)

## Testing Evidence
<!-- Paste test output showing coverage and passing tests -->
```
# Example:
# PASS  src/components/__tests__/ComponentName.test.tsx
# ✓ renders component (25 ms)
# ✓ handles user interaction (45 ms)
#
# Coverage: 85% statements, 80% branches, 90% functions, 85% lines
```

## Related Issues
<!-- Link to GitHub issues this PR addresses -->
Closes #
Fixes #
Related to #

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Additional Notes
<!-- Any additional context, decisions, or considerations -->
