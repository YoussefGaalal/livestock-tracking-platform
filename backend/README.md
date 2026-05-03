# Oasis Trace - Laravel + React

A livestock management dashboard for The Oasis Trace ecosystem.

## Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL/PostgreSQL

### Backend Setup

```bash
cd oasis-trace

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Create database and update .env with credentials
php artisan migrate

# Start dev server
php artisan serve
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server (runs on :5173, proxies API to :8000)
npm run dev
```

## Project Structure

```
oasis-trace/
├── app/
│   ├── Http/Controllers/     # Laravel controllers
│   ├── Http/Requests/        # Form request validation
│   └── Models/              # Eloquent models
├── database/migrations/      # Database migrations
├── resources/
│   ├── js/
│   │   ├── components/      # React components
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── views/              # Blade templates
├── routes/
│   └── api.php             # API routes
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/animals | List all animals |
| POST | /api/animals | Create new animal |
| GET | /api/animals/{id} | Get animal details |
| PUT | /api/animals/{id} | Update animal |
| DELETE | /api/animals/{id} | Delete animal |

## Tech Stack

- **Backend**: Laravel 11, PHP 8.2
- **Frontend**: React 18, Vite, Tailwind CSS
- **Icons**: react-material-symbols
- **Database**: MySQL/PostgreSQL via Eloquent
