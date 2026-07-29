# URL Shortener

A production-oriented URL Shortener built to learn **system design from first principles** — layered architecture, Cache Aside with Redis, and clean module boundaries — not just CRUD endpoints.

## Project Overview

| Layer | Responsibility |
| --- | --- |
| **Frontend** | React UI to shorten URLs and manage the list |
| **API** | Express routes → controller → service → repository |
| **PostgreSQL** | Source of truth for URL mappings |
| **Redis** | Cache Aside for `shortCode → originalUrl` on redirects |

### Create flow (deterministic Base62 — no random IDs)

1. Client submits a long URL  
2. Backend inserts the URL into PostgreSQL  
3. PostgreSQL assigns an autoincrement `id`  
4. Backend encodes that numeric ID with **Base62** (e.g. `1000` → `g8`)  
5. The short code is saved back onto the same row  
6. Backend returns `{ shortUrl: "http://localhost:3000/g8", ... }`  

No nanoid / UUID / random generators are used for short codes.

### Redirect path (`GET /:shortCode`) — Cache Aside

1. Check Redis  
2. On miss → load from PostgreSQL  
3. Write mapping into Redis  
4. Redirect the client  

URL creation does **not** write to Redis (Cache Aside on read).

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript (nginx in Docker) |
| Backend | Node.js, Express, TypeScript (ES Modules) |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Cache | Redis 7 |
| Containers | Docker Compose (full stack) |
| Validation | Zod |

## Folder Structure

```
url-shortener/
├── docker-compose.yml          # postgres + redis + backend + frontend
├── .env.example                # Compose defaults
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh    # migrate deploy → start API
│   ├── prisma/
│   ├── src/
│   └── ...
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── ...
```

## Prerequisites

- **Docker Desktop** (recommended path — runs everything)
- Or for local-only dev: Node.js 20+, local PostgreSQL, Redis

## How to Run (full Docker — recommended)

From the project root (`C:\UrlShorten`):

```bash
# Required: all container config comes from this file
cp .env.example .env

# Build and start Postgres, Redis, API, and UI
docker compose up -d --build
```

Do **not** hardcode secrets or URLs in Dockerfiles. Compose reads `.env` and passes values via `env_file` / `build.args`.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health | http://localhost:3000/health |
| Postgres (host) | `localhost:5433` (mapped to avoid clashing with local 5432) |
| Redis (host) | `localhost:6379` |

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down          # stop containers
docker compose down -v       # stop + delete DB/Redis volumes
```

On a fresh machine you only need Docker: clone the repo → `docker compose up -d --build`.

## How to Run (local Node + Docker infra)

Useful while actively coding the API/UI with hot reload.

```bash
# Infra only
docker compose up -d postgres redis

# Backend
cd backend
cp .env.example .env
# Point DATABASE_URL at localhost:5433 if using Compose Postgres
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Example `backend/.env` when Postgres/Redis come from Compose:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/url_shortener?schema=public"
REDIS_URL="redis://localhost:6379"
BASE_URL="http://localhost:3000"
NODE_ENV=development
```

## Available Scripts

### Backend (`backend/`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply migrations in development |
| `npm run prisma:deploy` | Apply migrations (used in Docker) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Run seed script |

### Frontend (`frontend/`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

### Root (Docker)

| Command | Description |
| --- | --- |
| `docker compose up -d --build` | Build & start full stack |
| `docker compose up -d postgres redis` | Infra only |
| `docker compose down` | Stop stack |
| `docker compose logs -f` | Tail logs |

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/urls` | Create a shortened URL |
| `GET` | `/api/v1/urls` | List all URLs |
| `GET` | `/api/v1/urls/:id` | Fetch a single URL |
| `DELETE` | `/api/v1/urls/:id` | Delete a URL |
| `GET` | `/:shortCode` | Redirect (Redis Cache Aside → PostgreSQL) |
| `GET` | `/health` | Health check |

### Example create body

```json
{
  "originalUrl": "https://example.com/some/long/path"
}
```

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `PORT` | backend | HTTP port (default `3000`) |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `REDIS_URL` | backend | Redis connection string |
| `BASE_URL` | backend | Public base for short URLs |
| `VITE_API_BASE_URL` | frontend | Backend URL used by the browser |
| `POSTGRES_*` | Compose | DB credentials / host port |

## Architecture Notes

```
Client
  → Express Routes
    → Controller (validate + HTTP)
      → Service (business rules + Cache Aside)
        → Repository (Prisma)
          → PostgreSQL

Redis sits beside PostgreSQL for redirect lookups only.
```

Docker network (Compose):

```
browser → frontend(:5173) / backend(:3000)
backend → postgres:5432
backend → redis:6379
```

## Future Improvements

- Rate limiting and abuse protection
- Custom aliases / expiration
- Click analytics (separate table when needed)
- Authentication and per-user URL ownership
- Integration tests and CI pipeline

## License

ISC
