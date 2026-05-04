# Contributing to Oasis Trace

## Team Workflow

We use a 4-person team with GitHub Projects for task management:

- **Tech Lead**: Architecture decisions, PR approvals
- **Backend Dev**: Laravel API, database, tests
- **Frontend Dev**: React UI, components, E2E tests
- **Flutter Dev**: Mobile app development

## Branching Strategy

```
main (production)
├── develop (integration)
│   ├── ramy-version (current work)
│   ├── feature/new-feature
│   └── bugfix/issue-fix
```

## Getting Started

1. Clone the repo: `git clone https://github.com/YoussefGaalal/Oasis-trace.git`
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes following coding standards
4. Write tests for your changes
5. Submit PR to `develop` branch

## Coding Standards

### PHP (Backend)
- Use Laravel Pint: `./vendor/bin/pint`
- Follow PSR-12 coding standard
- Use type hints and return types
- Document complex methods

### JavaScript/React (Frontend)
- Use ESLint: `npm run lint`
- Use Prettier for formatting
- Functional components with hooks
- Props validation with PropTypes or TypeScript

### Dart/Flutter (Mobile)
- Use `flutter format`
- Follow Flutter style guide
- Widget testing for components

## Pull Request Process

1. Ensure all tests pass: `php artisan test` and `npm run test`
2. Update documentation if needed
3. Fill out PR template with description
4. Request review from Tech Lead
5. Address feedback promptly
6. Squash commits before merge if requested

## Commit Messages

Use conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Build process or auxiliary tool changes

Example: `feat: add animal vaccination tracking`

## Testing Requirements

- Backend: PHPUnit feature tests for all API endpoints
- Frontend: Vitest for component tests
- E2E: Playwright for admin page testing
- Mobile: Flutter widget tests

## Questions?

Contact the Tech Lead or open an issue in GitHub Projects.
