# Utibu Health — Online Medication Platform

[![Backend CI](https://github.com/Ngaremaina/Utibu-Health/actions/workflows/backend.yml/badge.svg)](https://github.com/Ngaremaina/Utibu-Health/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/Ngaremaina/Utibu-Health/actions/workflows/frontend.yml/badge.svg)](https://github.com/Ngaremaina/Utibu-Health/actions/workflows/frontend.yml)

Browse medications, manage a cart, place orders and pay with M-Pesa.

| Layer    | Stack                                                                    |
| -------- | ------------------------------------------------------------------------ |
| Backend  | Flask 3, SQLAlchemy 2, Flask-JWT-Extended, Flask-Migrate, Marshmallow    |
| Database | [Neon](https://neon.tech) serverless Postgres (psycopg 3)                |
| Frontend | Expo (React Native) + TypeScript, React Navigation, Axios                |
| Payments | Safaricom Daraja — M-Pesa Express (STK push)                             |
| Testing  | pytest + coverage (backend), Jest + React Native Testing Library (app)   |

## Repository layout

```
backend/    Flask API (app factory in app/, Alembic migrations in migrations/, tests in tests/)
frontend/   Expo TypeScript app (src/api, src/screens, src/context, ...)
.github/    CI workflows and Dependabot config
```

## Backend

Requires Python 3.12+.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # then fill in the values
```

### Neon database

1. Create a Neon project and database (e.g. `utibu`).
2. Set `DATABASE_URL` in `.env` to the **pooled** connection string (host contains `-pooler`).
   `postgresql://` URLs are rewritten to use the psycopg 3 driver automatically.
3. Run migrations against the **direct** (non-pooled) connection string:

   ```bash
   DATABASE_URL='postgresql://...direct-host.../utibu?sslmode=require' flask --app wsgi db upgrade
   flask --app wsgi seed           # optional sample products
   flask --app wsgi create-admin   # admin user for managing products
   ```

Without `DATABASE_URL`, development falls back to a local SQLite file.

### Run

```bash
flask --app wsgi run --debug                 # development
gunicorn -c gunicorn.conf.py wsgi:app        # production (APP_ENV=production)
docker build -t utibu-api . && docker run --env-file .env -p 5000:5000 utibu-api
```

In production `SECRET_KEY`, `JWT_SECRET_KEY` (32+ chars) and `DATABASE_URL` are required.

### API (`/api/v1`)

| Area      | Endpoints                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------- |
| Health    | `GET /health`                                                                                  |
| Auth      | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`                |
| Profile   | `GET /profile`, `PUT /profile`, `GET/POST /addresses`, `DELETE /addresses/:id`                 |
| Products  | `GET /products`, `GET /products/:id`; admin: `POST /products`, `PATCH/DELETE /products/:id`    |
| Cart      | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`, `DELETE /cart`                |
| Orders    | `GET /orders`, `GET /orders/:id`, `POST /orders`, `POST /orders/:id/pay`, `POST /orders/:id/cancel` |
| Payments  | `POST /payments/mpesa/callback` (Daraja callback)                                              |

### Tests and lint

```bash
ruff check . && ruff format --check .
pytest --cov                                  # in-memory SQLite by default
TEST_DATABASE_URL=postgresql://... pytest     # against Postgres (what CI does)
```

> `TEST_DATABASE_URL` tables are dropped and recreated — never point it at a real database.

## Frontend

Requires Node 22.13+ or 24.3+.

```bash
cd frontend
npm install
cp .env.example .env    # set EXPO_PUBLIC_API_URL; on a physical device use your machine's LAN IP
npm start               # or: npm run android | npm run ios | npm run web
```

Checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test                # or npm run test:ci for coverage
```

## Continuous integration

- **Backend CI** — Ruff lint/format; pytest on Python 3.12 and 3.13 against a Postgres 17 service,
  including an Alembic upgrade → model drift check → downgrade round trip; Docker image build.
- **Frontend CI** — `tsc`, ESLint, Prettier, `expo install --check`; Jest on Node 22 and 24; web export.
- **Dependabot** — weekly npm, pip and GitHub Actions updates. Minor/patch PRs auto-merge once the
  required checks pass; Expo SDK packages are grouped and SDK majors are upgraded manually.

## License

This project is licensed under the [MIT License](LICENSE).
