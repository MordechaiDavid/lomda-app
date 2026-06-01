# Lomda App - Contributing Guidelines

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/lomda-app.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Run setup: `bash scripts/setup-env.sh`

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix
2. Make your changes following our code standards
3. Write or update tests for your changes
4. Test locally: `npm run dev`

### Code Standards

- Use TypeScript for all new code
- Follow ESLint rules: `npm run lint`
- Format code with Prettier: `npm run format`
- Keep components small and focused
- Use meaningful variable/function names
- Add comments for complex logic

### Commit Messages

Follow conventional commits:
```
feat: add passwordless authentication
fix: resolve magic link expiration bug
docs: update API documentation
test: add unit tests for quiz service
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test -- auth.test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Pull Request Process

1. Update README.md with any new features
2. Add tests for new functionality
3. Ensure all tests pass: `npm run test`
4. Run linting: `npm run lint:fix`
5. Provide a clear description of changes
6. Link related issues
7. Request review from maintainers

## Code Review

We look for:
- ✅ Code quality and readability
- ✅ Proper error handling
- ✅ Security considerations
- ✅ Test coverage
- ✅ Documentation
- ✅ Performance impact

## Architecture Decisions

For major changes:
1. Create an issue first to discuss
2. Document the decision in ADR format
3. Get feedback from maintainers
4. Update architecture docs

## Reporting Bugs

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs
- Environment details (Node version, OS, etc.)

## Feature Requests

Include:
- Use case/motivation
- Proposed solution
- Alternative approaches considered

## Questions?

- Create a GitHub Discussion
- Email: dev@lomda-app.com
- Join our Slack community

## License

By contributing, you agree that your contributions will be licensed under MIT License.
