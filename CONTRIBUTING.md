# Contributing to OpenTTS

Thank you for your interest in contributing to OpenTTS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use issue templates when available
3. Provide clear descriptions with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version)

### Suggesting Features

1. Open a GitHub issue with the "enhancement" label
2. Describe the feature and its use cases
3. Explain why it would benefit the project

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Update documentation as needed
7. Commit with descriptive messages
8. Push to your fork
9. Open a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/opentts.git
cd opentts

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your OpenAI API key to .env

# Link globally for development
npm link

# Now you can test the CLI globally
opentts --help

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Unlink when done with development
npm unlink -g opentts
```

## Coding Standards

### JavaScript Style

- Use ES6+ features where appropriate
- Follow existing code patterns
- Add JSDoc comments for functions
- Keep functions focused and small
- Handle errors appropriately

### Testing

- Write unit tests for new functions
- Maintain >95% test coverage
- Test edge cases and error scenarios
- Use descriptive test names

### Commit Messages

Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Build/tooling changes

Examples:
```
feat: add support for FLAC audio format
fix: handle empty audio files gracefully
docs: update README with new examples
```

## Project Structure

```
opentts/
├── src/                  # Source code
│   ├── commands/         # CLI command modules
│   ├── index.js          # Entry point
│   └── ...              # Core modules
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── docs/                # Documentation
└── ...
```

## Testing Guidelines

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

- Test public APIs, not implementation details
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test error cases

## Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for development guidelines
- Add JSDoc comments for new functions
- Include examples for new features

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Run tests and ensure passing
4. Create pull request to main branch
5. After merge, tag release

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Contact maintainers

Thank you for contributing to OpenTTS!