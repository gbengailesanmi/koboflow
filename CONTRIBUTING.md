# Contributing to Consolidate Budget E2E

Thank you for your interest in contributing to the Consolidate Budget E2E project! This guide will help you get started with contributing to the codebase.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/consolidate-budget-e2e.git
cd consolidate-budget-e2e

# Add the original repository as upstream
git remote add upstream https://github.com/gbengailesanmi/consolidate-budget-e2e.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
yarn install

# Copy environment template
cp .env.example .env.local

# Set up your environment variables (see ENVIRONMENT.md)
# Edit .env.local with your configuration

# Set up database
yarn db:schema

# Start development server
yarn dev
```

### 3. Create a Branch

```bash
# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-description
```

## Development Workflow

### Branch Naming

Use descriptive branch names following these patterns:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages

Follow the conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(auth): add JWT session management
fix(ui): resolve mobile responsive issues
docs(api): update endpoint documentation
refactor(db): optimize query performance
test(auth): add login validation tests
```

### Code Standards

#### TypeScript

- Use strict TypeScript configuration
- Define explicit types for all functions and variables
- Use interfaces for object structures
- Avoid `any` type - use `unknown` instead

```typescript
// Good
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processUser(user: UserData): void {
  // Implementation
}

// Bad
function processUser(user: any): void {
  // Implementation
}
```

#### React Components

- Use functional components with hooks
- Define prop interfaces
- Use default props where appropriate
- Handle loading and error states

```tsx
interface ComponentProps {
  title: string;
  onAction: (id: string) => void;
  isLoading?: boolean;
}

export default function Component({ 
  title, 
  onAction, 
  isLoading = false 
}: ComponentProps) {
  // Component implementation
}
```

#### API Routes

- Validate all input data
- Handle errors gracefully
- Return consistent response formats
- Use appropriate HTTP status codes

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    
    const result = await processData(validatedData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }
}
```

### Testing

Write tests for new features and bug fixes:

```bash
# Run tests (when implemented)
yarn test

# Run type checking
yarn type-check

# Run linting
yarn lint
```

#### Test Structure

```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Test implementation
  });

  it('should handle error cases', () => {
    // Error handling test
  });
});
```

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows project standards
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated if needed
- [ ] Self-review completed

### 2. Pull Request Template

When creating a PR, include:

**Description:**
- What changes were made and why
- Any breaking changes
- Screenshots for UI changes

**Testing:**
- How the changes were tested
- Any edge cases considered

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Tests added/updated
- [ ] Documentation updated

### 3. Review Process

- All PRs require at least one review
- Address all review comments
- Keep PRs focused and reasonably sized
- Update branch with latest main before merging

## Issue Guidelines

### Bug Reports

When reporting bugs, include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node version
- **Screenshots**: If applicable

### Feature Requests

For new features, include:

- **Description**: Clear description of the feature
- **Use Case**: Why this feature is needed
- **Proposed Solution**: How it might work
- **Alternatives**: Other solutions considered

## Development Guidelines

### 1. Performance

- Use Next.js Image component for images
- Implement proper loading states
- Minimize bundle size
- Use dynamic imports for heavy components

### 2. Security

- Validate all user input
- Use environment variables for secrets
- Implement proper authentication checks
- Follow OWASP security guidelines

### 3. Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Maintain color contrast ratios

### 4. Responsive Design

- Mobile-first approach
- Test on multiple screen sizes
- Use Tailwind responsive utilities
- Ensure touch targets are appropriate

## Database Changes

### Schema Changes

When modifying the database schema:

1. Update `drizzle/schema.ts`
2. Generate migration if needed
3. Test migration locally
4. Update type definitions
5. Document breaking changes

```bash
# Generate migration
npx drizzle-kit generate

# Push changes
yarn db:schema

# Verify in Drizzle Studio
yarn db:check
```

## Documentation

### When to Update Documentation

- New features or APIs
- Changed behavior
- Configuration changes
- Breaking changes

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Keep examples up to date

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped appropriately
- [ ] Changelog updated
- [ ] Tag created

## Community

### Getting Help

- Check existing documentation
- Search existing issues
- Ask questions in discussions
- Join our community channels

### Helping Others

- Answer questions in issues
- Review pull requests
- Improve documentation
- Help with testing

## Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation

## Tools and Resources

### Recommended Tools

- **VS Code** with TypeScript and Tailwind extensions
- **Chrome DevTools** for debugging
- **React Developer Tools** browser extension
- **Drizzle Studio** for database management

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tink API Documentation](https://docs.tink.com)

## Questions?

If you have questions about contributing:

1. Check this guide first
2. Look through existing issues
3. Create a new discussion
4. Reach out to maintainers

Thank you for contributing to Consolidate Budget E2E! 🎉