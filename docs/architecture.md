# ProfileReel AI – System Architecture Documentation

**Tagline:** "One profile. One AI. One powerful story."

---

## 1. Executive Summary & Vision

ProfileReel AI is a production-minded web application engineered to transform candidate LinkedIn profiles into short, narrated, animated video introductions. The core philosophy requires simplicity for the user:
- The **only mandatory input** is a candidate's LinkedIn profile URL.
- Résumé uploads or manual candidate-detail entry are never mandatory.
- **Zero Scraping & Zero Hallucination**: If profile data cannot be retrieved through authorized access, the system returns a structured `PROFILE_DATA_UNAVAILABLE` response with an explicit message. The AI will never fabricate career history, degrees, or achievements.

---

## 2. Monorepo Architecture

```
ProfileReel AI/
├── backend/
│   ├── src/
│   │   ├── config/            # Database and application environment configs
│   │   ├── database/          # TypeORM DataSource and versioned migrations
│   │   ├── modules/
│   │   │   ├── auth/          # User authentication and entities
│   │   │   ├── candidates/    # Candidate ingestion, persistence, and DTOs
│   │   │   ├── health/        # Real-time DB connectivity & system health checks
│   │   │   ├── jobs/          # Async job tracking and lifecycle stages
│   │   │   ├── profile-retrieval/ # Modular IProfileDataProvider & test fixtures
│   │   │   └── video-generation/  # Video entity and composition pipeline
│   │   ├── app.module.ts
│   │   └── main.ts            # Swagger OpenAPI, validation pipes, and bootstrap
│   ├── test/                  # Supertest e2e integration suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, SubmissionCard, DetailsCard, CandidateList
│   │   ├── pages/             # DashboardPage
│   │   ├── services/          # Typed API client
│   │   ├── types/             # TypeScript interfaces matching backend DTOs
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js     # Dark charcoal / violet theme design system
│   └── vite.config.ts         # Vite bundler, proxy, and Vitest setup
├── docs/
│   ├── architecture.md        # This specification
│   └── phase1.md              # Phase 1 verification and operational summary
├── docker-compose.yml         # Containerized MySQL 8.4 service definition
├── .env.example               # Root configuration template
└── README.md                  # Comprehensive setup and run guide
```

---

## 3. Data Retrieval Feasibility & Compliance Analysis

Profile retrieval is the primary feasibility risk for any LinkedIn-based application. ProfileReel AI implements a modular abstraction layer to separate data retrieval from business logic.

```mermaid
graph TD
    User([User pastes LinkedIn URL]) --> Validator[LinkedInUrlValidator]
    Validator -->|Invalid / Unsafe URL| Err400[400 Bad Request]
    Validator -->|Normalized URL & Slug| Svc[CandidatesService]
    Svc --> Job[Create GenerationJob]
    Svc --> Provider{IProfileDataProvider}
    Provider -->|Mock Provider Phase 1| Fixtures[(Verified Fixtures)]
    Provider -.->|Future Approved API| LinkedInAPI[Official LinkedIn Talent API]
    Provider -.->|Future Licensed Data| B2BProvider[Licensed B2B Talent Provider]
    
    Fixtures -->|Known Profile| Success[Extract Verified Facts]
    Fixtures -->|Private / Missing Profile| Unavail[PROFILE_DATA_UNAVAILABLE]
    
    Success --> SaveFacts[(Save CandidateFacts to MySQL)]
    Success --> JobReady[Job Stage: READY_FOR_SCRIPT]
    
    Unavail --> NoFake[Job Stage: FAILED - Data Unavailable]
    Unavail --> Explain[Display Integrity Notice - No Hallucinations]
```

### Constraints Adhered To:
1. **No Scraping**: No automated page scraping or HTML parsing of linkedin.com.
2. **No Session Hijacking**: No automation from logged-in sessions, cookie theft, or password storage.
3. **No CAPTCHA Bypassing**: Respect for network security and terms of service.
4. **Zero Hallucination Policy**: When data is unavailable, the pipeline stops gracefully. Missing facts are never invented by an LLM.

---

## 4. Normalized MySQL Database Schema

The backend directly connects to MySQL 8.4 using TypeORM with strict foreign keys, indexes, and versioned migrations.

```mermaid
erDiagram
    users {
        varchar(36) id PK
        varchar(255) email UK
        varchar(255) passwordHash
        datetime createdAt
        datetime updatedAt
    }

    candidates {
        varchar(36) id PK
        varchar(500) submittedProfileUrl
        varchar(500) normalizedProfileUrl
        varchar(255) displayName
        enum retrievalStatus
        datetime createdAt
        datetime updatedAt
    }

    candidate_facts {
        varchar(36) id PK
        varchar(36) candidateId FK
        enum category
        text factText
        varchar(100) sourceType
        enum verificationStatus
        datetime createdAt
    }

    generation_jobs {
        varchar(36) id PK
        varchar(36) candidateId FK
        enum status
        varchar(100) currentStage
        varchar(100) errorCode
        text errorMessage
        datetime createdAt
        datetime updatedAt
    }

    generated_videos {
        varchar(36) id PK
        varchar(36) candidateId FK
        varchar(36) generationJobId
        text script
        varchar(500) videoStoragePath
        int durationSeconds
        enum status
        datetime createdAt
    }

    candidates ||--o{ candidate_facts : "has many"
    candidates ||--o{ generation_jobs : "tracks"
    candidates ||--o{ generated_videos : "generates"
```

---

## 5. Security & SSRF Protection

1. **LinkedIn URL Validation**: `LinkedInUrlValidator` checks protocol (`http`/`https` only), domain (must match `*.linkedin.com` or `linkedin.com`), path (`/in/{slug}`), and slug length (2–100 characters). All queries and tracking params are stripped.
2. **SSRF Guard**: Localhost, private IPs (10.x, 192.168.x, 127.x), metadata service IPs (169.254.169.254), and unsupported protocols (`ftp:`, `file:`, `javascript:`) are explicitly blocked.
3. **DTO Whitelisting**: NestJS `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unexpected payload properties.
4. **Credentials Isolation**: Zero hardcoded credentials. All configuration uses `.env`.
