# Contributing to WebView Testing

Thank you for your interest in contributing! This project aims to make WebView testing accessible to all web developers.

## How to Contribute

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide device/OS information
- Include test logs and error messages
- Share reproduction steps

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages
6. Push and create a PR

### Code Style

- Use TypeScript for all source code
- Follow existing code style (run `npm run lint` if available)
- Add JSDoc comments for public functions
- Keep functions focused and testable

### Testing Guidelines

- Write tests that are reliable and reproducible
- Avoid hard-coded waits; use proper wait conditions
- Clean up resources (close browsers, stop servers)
- Handle errors gracefully

### Documentation

- Update relevant docs when adding features
- Include code examples
- Keep language clear and concise
- Consider non-expert users

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Areas for Contribution

### High Priority
- Additional test scenarios for collector.openwebdocs.org
- Better error handling and retry logic
- Performance optimization
- Cross-platform test compatibility

### Medium Priority
- Support for more WebView configurations
- Additional result visualization
- CI/CD improvements
- Test parallelization strategies

### Documentation
- Video tutorials
- Blog posts
- MDN article drafts
- Example projects

## Communication

- GitHub Issues for bugs and features
- GitHub Discussions for questions and ideas
- WebView CG meetings for strategic decisions

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
