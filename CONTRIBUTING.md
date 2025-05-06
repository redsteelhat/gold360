# Contributing to Gold360

Thank you for your interest in contributing to the Gold360 platform! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

We expect all participants to adhere to professional and respectful behavior while contributing to this project.

## Development Workflow

### Branching Strategy

We follow a simplified GitFlow workflow:

- `main`: Production code, always stable
- `dev`: Development branch, where features are integrated
- `feature/*`: For new features
- `bugfix/*`: For bug fixes
- `hotfix/*`: For urgent fixes to production

### Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment as described in the README.md
4. Create a new branch for your work based on `dev`

```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
```

### Coding Standards

#### General Guidelines

- Use meaningful variable and function names
- Write clear comments for complex logic
- Keep functions small and focused on a single responsibility
- Write unit tests for your code

#### Backend (Node.js/TypeScript)

- Follow the TypeScript best practices
- Use async/await for asynchronous operations
- Follow RESTful API design principles
- Document API endpoints using OpenAPI/Swagger

#### Frontend (React/Next.js)

- Use functional components with hooks
- Follow component composition patterns
- Use TypeScript for type safety
- Implement responsive design for all screen sizes

#### Mobile (React Native)

- Ensure consistent behavior across iOS and Android
- Optimize performance for mobile devices
- Follow platform-specific design guidelines when necessary

### Commit Messages

We follow the Conventional Commits specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process, tools, or dependencies

Example: `feat(auth): implement JWT authentication`

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if necessary
3. Ensure your code follows the project's coding standards
4. Create a pull request to the `dev` branch
5. Describe what your PR does and why it's needed
6. Link any relevant issues

## License

By contributing to Gold360, you agree that your contributions will be licensed under the project's license. 