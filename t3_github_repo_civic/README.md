# T3 Backend (Dev Kit) — Google Civic Prewired
**Date:** 2025-09-06

This repo bootstraps the **T3 backend** (Postgres + PostGIS, OpenSearch, Express API) with the braided content model and a **live Google Civic Information API integration** for `/civic/representatives`.

## Quick Start (Local)
```bash
cp .env.example .env
# add GOOGLE_CIVIC_API_KEY to .env
docker compose -f infra/docker/docker-compose.yml up -d --build
docker exec -i t3_db psql -U t3 -d t3 < /schema.sql
docker exec -i t3_db psql -U t3 -d t3 < /seed.sql
curl "http://localhost:8080/civic/representatives?zip=77002"
```

## GitHub Actions Secrets
Set repo secret **`GOOGLE_CIVIC_API_KEY`** (Settings → Secrets and variables → Actions → New repository secret). CI writes it into a runtime `.env` file so the API can call Google during smoke tests (falls back to stub if not present).

## Endpoints
- `GET /health`
- `GET /geo/resolve?zip=77002`
- `GET /civic/representatives?zip=77002` → live Google Civic lookup (with graceful fallback)
- `GET /resources?zip=77002&types=event,ecourse`
- `GET /items/:id`, `POST /items`

## Civic Integration Notes
- Uses `https://civicinfo.googleapis.com/civicinfo/v2/representatives`
- Accepts `address` or `zip`; we pass `zip` for coarse results.
- Normalize output to: `name, role (office), level, phone, email?, website`.

## License
MIT
