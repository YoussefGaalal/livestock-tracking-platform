# Oasis Trace

A livestock management platform for tracking animals, devices, geofences, and health records with multi-language support.

## Tech Stack

- **Backend**: Laravel 11, PHP 8.4, MySQL/PostgreSQL
- **Frontend**: React 18, Vite, Tailwind CSS
- **Mobile**: Flutter (in development)
- **Auth**: Laravel Sanctum
- **Payments**: Stripe
- **Roles**: Spatie Laravel Permission
- **Deployment**: Railway

## Team Structure

| Role | Responsibility |
|------|----------------|
| Tech Lead | Architecture, code reviews, PR approvals, Railway setup |
| Backend Dev | Laravel API, migrations, PHPUnit tests |
| Frontend Dev | React components, Playwright tests, UI |
| Flutter Dev | Mobile app development |

## Quick Start

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend
```bash
cd backend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

## Project Structure

```
oasis-trace/
├── backend/          # Laravel API + React SPA
│   ├── app/
│   ├── resources/js/ # React components
│   └── tests/
├── frontend/         # Additional frontend config
└── mobile/           # Flutter mobile app (WIP)
```

## Development Workflow

- `main` - Production branch
- `develop` - Integration branch
- `ramy-version` - Current working branch
- Feature branches: `feature/`, `bugfix/`

All PRs require Tech Lead approval. CI runs PHPUnit + ESLint before merge.

## Testing

```bash
# Backend tests
cd backend && php artisan test

# Frontend tests
cd backend && npm run test

# E2E tests
cd backend && node test-admin-pages.mjs
```

## Deployment

Staging and production deployments via Railway. Staging auto-deploys from `develop`, production from `main`.

## License

Proprietary - The Oasis
