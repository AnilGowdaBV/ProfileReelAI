# ProfileReel AI

> **"One profile. One AI. One powerful story."**

ProfileReel AI transforms a candidate's professional profile into a short, narrated, animated introduction video reel. The candidate's LinkedIn profile URL is the only required input.

---

## Architecture Overview

ProfileReel AI is organized as a clean, modular monorepo:

- **`backend/`**: NestJS, TypeScript, TypeORM, MySQL 8.4, REST API with Swagger/OpenAPI, Jest & Supertest.
- **`frontend/`**: React, Vite, TypeScript, Tailwind CSS, TanStack Query, Vitest & React Testing Library.
- **`docs/`**: Full architecture specifications and Phase 1 completion reports.
- **`docker-compose.yml`**: Optional Docker container configuration for MySQL.

---

## Prerequisites

- **Node.js**: v20+ or v24+
- **npm**: v10+ or v11+
- **MySQL**: MySQL Server 8.0+ / 8.4 (or use `docker compose up -d mysql`)
- **MySQL Workbench**: Recommended for inspecting the live database

---

## Quick Start Guide

### 1. Configure Environment Variables

The project includes pre-configured environment files:

```bash
# Root example file
cp .env.example .env
```

Ensure `backend/.env` points to your MySQL database credentials:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174

# MySQL Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here
DB_DATABASE=profilereel_ai
DB_SYNCHRONIZE=false

# Profile Data Provider (apify or mock)
PROFILE_DATA_PROVIDER=apify
APIFY_TOKEN=your_apify_api_token_here
APIFY_ACTOR_ID=calm_builder~linkedin-profile-scraper
```

### 2. Run Database Migrations

Run TypeORM migrations from the `backend/` directory to create all normalized tables in MySQL:

```powershell
cd backend
npm.cmd run migration:run
```

### 3. Start the Backend API

From the `backend/` directory:

```powershell
cd backend
npm.cmd run start:dev
```

- API Base URL: `http://localhost:3000/api`
- Swagger OpenAPI Docs: `http://localhost:3000/api/docs`
- Health Endpoint: `http://localhost:3000/api/health`

### 4. Start the Frontend Dashboard

In a second terminal, start the React development server:

```powershell
cd frontend
npm.cmd run dev
```

- Web Dashboard: `http://localhost:5174`

---

## Testing

### Backend Unit Tests
```powershell
cd backend
npm.cmd test
```

### Backend E2E Integration Tests (against local MySQL)
```powershell
cd backend
npm.cmd run test:e2e
```

### Frontend Tests (Vitest)
```powershell
cd frontend
npm.cmd test
```

---

## Phase 1 Test Profiles & Fixtures

Use these pre-configured fixtures to test ingestion and fact extraction:

| Profile Name | URL Slug | Description / Outcome |
| :--- | :--- | :--- |
| **Alex Chen** | `alex-chen-senior-fullstack` | Staff Full-Stack Architect (10+ yrs exp, 10 skills, UC Berkeley) |
| **Sarah Jenkins** | `sarah-jenkins-product-lead` | VP of Product & AI (MBA Columbia, SaaS scale-up veteran) |
| **Marcus Vance** | `marcus-vance-cloud-devops` | Lead Cloud & DevOps Engineer (Kubernetes, AWS, Terraform) |
| **Priya Sharma** | `priya-sharma-data-scientist` | Principal AI Researcher (Transformers, PyTorch, CMU) |
| **Private Profile** | `private-profile` | Strict privacy test: returns `PROFILE_DATA_UNAVAILABLE` |
| **Unknown URL** | `any-unmapped-user` | Returns `PROFILE_DATA_UNAVAILABLE` (zero hallucinated data) |

---

## Security & Compliance Highlights

- **Zero Scraping Policy**: Automated page scraping, session cookie hijacking, and CAPTCHA bypassing are forbidden.
- **Zero Hallucination Policy**: When profile data cannot be retrieved from an authorized source, the system halts script generation rather than fabricating career information.
- **SSRF Prevention**: `LinkedInUrlValidator` restricts schemes to `http`/`https`, validates hostnames against `*.linkedin.com`, and rejects internal/private IPs.
- **Database Normalization**: Cascade deletions, foreign keys, and indexes on candidate URLs, fact categories, and job states.
