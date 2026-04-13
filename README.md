# Recoflow

[![CI](https://github.com/marcos-astudillo/recoflow/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/marcos-astudillo/recoflow/actions)
![Node.js](https://img.shields.io/badge/Runtime-Node.js%2020-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/HTTP%20Framework-Fastify%205-20232A?logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Cache%20%2F%20Store-Redis%207-DC382D?logo=redis&logoColor=white)
![Kafka](https://img.shields.io/badge/Streaming-Kafka-231F20?logo=apachekafka&logoColor=white)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![Vitest](https://img.shields.io/badge/Testing-Vitest-646CFF)
![License](https://img.shields.io/github/license/marcos-astudillo/recoflow?color=blue)


> A production-grade **Recommendation System** built with Node.js, TypeScript, and Fastify.
> Implements a two-stage candidate generation + ML ranking pipeline, real-time event streaming via Kafka, Redis response caching, graceful fallback, rate limiting, and full observability.

---

## API Preview

Swagger UI running locally — interactive documentation for all endpoints.

<p align="center">
  <img src="docs/images/swagger-ui.png" alt="Swagger UI" width="900"/>
</p>

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Recommendation Pipeline](#recommendation-pipeline)
- [Event Streaming](#event-streaming)
- [Caching & Fallback](#caching--fallback)
- [Rate Limiting](#rate-limiting)
- [API Docs (Swagger UI)](#api-docs-swagger-ui)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Docker](#docker)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Scaling Considerations](#scaling-considerations)
- [System Design Reference](#system-design-reference)

---

## Features

| Feature | Description |
|---|---|
| **Two-stage pipeline** | Candidate generation (ANN + popularity + recency) → ML ranking on top candidates |
| **Event streaming** | Kafka producer publishes click/view/purchase events to the offline training pipeline |
| **Response cache** | Redis-backed cache with configurable TTL — `CACHE_ENABLED` flag |
| **Graceful fallback** | Returns popular items instead of 500 when the ranking service degrades |
| **Rate limiting** | `@fastify/rate-limit` per IP, configurable window and max — `RATE_LIMIT_ENABLED` flag |
| **Feature store** | Redis counters for real-time popularity and user activity; PostgreSQL for event log |
| **Model registry** | PostgreSQL table tracks trained model versions and promotion status |
| **Observability** | Structured JSON logs (pino), per-request timing, global error handler |
| **API Docs** | OpenAPI 3.0 with full schemas, descriptions, and examples at `/docs` |

**Feature flags** (set in `.env`):

| Flag | Default | Description |
|---|---|---|
| `CACHE_ENABLED` | `true` | Enable Redis response caching (TTL 60 s) |
| `FALLBACK_ENABLED` | `true` | Return popular fallback on ranking failure |
| `RATE_LIMIT_ENABLED` | `true` | Enable global rate limiting |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in ms |
| `FEATURE_ANALYTICS` | `true` | Request-level analytics logging |

---

## Architecture

```
Client → Recommendation API → Candidate Generator → Feature Store (Redis + PG)
                             ↘ Ranking Service    ↗
                             → Response Cache (Redis)

Client → Event Collector → PostgreSQL (event log)
                         → Redis (popularity + user counters)
                         → Kafka (events topic) → Offline Training Pipeline
                                                 → Model Registry (PG)
```

See full diagrams in [`docs/diagrams/`](./docs/diagrams/):
- [Architecture diagram](./docs/diagrams/architecture.md)

**Request flow for `GET /v1/recommendations`:**
```
→ rate limiter (per IP)
→ cache lookup (Redis — serves response on HIT)
→ candidate generation (popularity pool + recency pool + similarity pool)
→ ranking (personalized score = base_score × log(1 + userActivity))
→ cache store (Redis SETEX on success)
→ response (or fallback popular items on error)
```

**Request flow for `POST /v1/events`:**
```
→ rate limiter
→ Zod schema validation
→ INSERT into PostgreSQL events table
→ Redis INCR user interaction counter
→ Redis INCR item popularity counter
→ Kafka producer.send (non-blocking, errors are logged not thrown)
→ 202 Accepted
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript |
| HTTP Framework | Fastify 5 |
| Database | PostgreSQL 15 |
| Cache / Feature Store | Redis 7 |
| Event Streaming | Kafka (Confluent 7.5) + ZooKeeper |
| Validation | Zod |
| Logging | pino (structured JSON) |
| Rate Limiting | @fastify/rate-limit |
| API Docs | @fastify/swagger + @fastify/swagger-ui (OpenAPI 3.0) |
| Testing | Vitest |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions → GitHub Container Registry |

---

## Project Structure

```
recoflow/
├── src/
│   ├── app.ts                          # Fastify app factory (testable, no port binding)
│   ├── server.ts                       # Entry point — binds port, reads .env
│   ├── config/
│   │   └── swagger.ts                  # OpenAPI 3.0 spec + component schemas
│   ├── controllers/
│   │   ├── recommendation.controller.ts
│   │   └── event.controller.ts
│   ├── services/
│   │   ├── recommendation.service.ts   # Cache check → generate → rank → cache store
│   │   ├── candidate.service.ts        # Popularity + recency + similarity pools
│   │   └── ranking.service.ts          # Personalized scoring + sort + slice
│   ├── repositories/
│   │   ├── event.repository.ts         # INSERT INTO events (PostgreSQL)
│   │   ├── userFeature.repository.ts   # user interaction counters (Redis)
│   │   └── itemFeature.repository.ts   # item popularity counters (Redis)
│   ├── infrastructure/
│   │   ├── db.client.ts                # PostgreSQL pool (pg)
│   │   ├── redis.client.ts             # Redis client (ioredis)
│   │   └── kafka.client.ts             # Kafka producer (kafkajs)
│   ├── middleware/
│   │   └── rateLimiter.ts              # @fastify/rate-limit registration
│   ├── models/
│   │   ├── recommendation.model.ts     # Zod schema: query params
│   │   └── event.model.ts              # Zod schema: event body
│   ├── pipelines/
│   │   └── offlineTraining.pipeline.ts # Training data generation (batch)
│   └── types/
│       └── fastify.d.ts                # Fastify type augmentations
├── tests/
│   ├── api.test.ts                     # API integration tests (all endpoints, mocked infra)
│   └── recomendation.test.ts           # Recommendation service unit tests (mocked Redis)
├── docs/
│   ├── images/                         # Screenshots (swagger-ui.png, etc.)
│   ├── architecture.md
│   └── diagrams/
│       └── architecture.md             # Mermaid architecture diagram
├── scripts/
│   └── init.sql                        # DB schema (auto-run by Docker on first start)
├── .github/workflows/
│   └── ci-cd.yml                       # Typecheck → test → build → Docker push → (deploy)
├── docker-compose.yml                  # Full local stack: app + postgres + redis + kafka
├── Dockerfile
├── vitest.config.ts
└── .env.example
```

---

## Recommendation Pipeline

### Stage 1 — Candidate Generation (`candidate.service.ts`)

Builds a pool of ~250 candidates from three sources:

| Pool | Size | Strategy |
|---|---|---|
| Popular | 100 | Item popularity counter from Redis (`item:{id}:popularity`) |
| Recent | 100 | Mock recent items (replace with time-series query in production) |
| Similar | 50 | Mock similar items (replace with ANN index in production) |

> **Production path:** Replace mock pools with an Approximate Nearest Neighbor index (Faiss, Weaviate, Qdrant) operating over millions of items.

### Stage 2 — Ranking (`ranking.service.ts`)

Applies personalized scoring over the candidate pool:

```
score = base_score × log(1 + userActivity + 1)
```

Where `userActivity` is read from the Redis user interaction counter (`user:{id}:interactions`).
Candidates are sorted descending by score and the top N are returned.

---

## Event Streaming

`POST /v1/events` handles three interaction types: `click`, `view`, `purchase`.

Each event is:
1. Validated with Zod (strict schema)
2. Persisted to PostgreSQL (`events` table)
3. Used to increment Redis counters (user activity + item popularity)
4. Published to Kafka topic `events` (best-effort — Kafka errors are logged, not thrown)

The Kafka `events` topic feeds the offline training pipeline which generates new model versions tracked in the `model_registry` table.

---

## Caching & Fallback

### Response Cache

| Setting | Value |
|---|---|
| Store | Redis |
| TTL | 60 seconds |
| Key | `recs:{userId}:{context\|default}` |
| Control | `CACHE_ENABLED=true/false` |

Cache is bypassed on cache miss and populated after a successful ranking response.

### Fallback

When the recommendation pipeline throws (Redis down, model unavailable), the service returns a static list of popular fallback items with `score: 0.5` and `reason: "fallback_popular"` — controlled by `FALLBACK_ENABLED=true`.

---

## Rate Limiting

Implemented with `@fastify/rate-limit`, registered globally.

| Setting | Default |
|---|---|
| Max requests | 100 |
| Window | 60 000 ms (60 s) |
| Scope | Per IP address |
| Control | `RATE_LIMIT_ENABLED=true/false` |

Response when limit is exceeded (`429`):
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 60s."
}
```

---

## API Docs (Swagger UI)

The service ships with an interactive **OpenAPI 3.0** UI powered by `@fastify/swagger` and `@fastify/swagger-ui`.

| URL | Description |
|---|---|
| `GET /docs` | Swagger UI — try every endpoint in the browser |
| `GET /docs/json` | Raw OpenAPI 3.0 spec (JSON) |
| `GET /docs/yaml` | Raw OpenAPI 3.0 spec (YAML) |

```bash
npm run dev
open http://localhost:3000/docs
```

---

## API Reference

### Recommendations

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/recommendations` | Get personalized recommendations for a user |

**`GET /v1/recommendations`**

```
GET /v1/recommendations?user_id=u_1&limit=20&context=home
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `user_id` | string | ✅ | — | User identifier |
| `limit` | integer (1–100) | | `20` | Number of items to return |
| `context` | string | | — | Surface context (`home`, `search`, `pdp`) |

Response `200`:
```json
{
  "items": [
    { "item_id": "p_10", "score": 0.91, "reason": "personalized" }
  ]
}
```

### Events

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/events` | Track a user interaction event |

**`POST /v1/events`**

```json
{
  "type": "click",
  "user_id": "u_1",
  "item_id": "p_10",
  "ts": "2024-01-15T10:30:00Z"
}
```

| Field | Type | Values |
|---|---|---|
| `type` | string | `click`, `view`, `purchase` |
| `user_id` | string | User identifier |
| `item_id` | string | Item identifier |
| `ts` | ISO 8601 datetime | Timestamp of the event |

Response `202`: `{ "status": "accepted" }`

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe — always `200` when service is up |

---

## Environment Variables

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | | `3000` | Server port |
| `POSTGRES_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `KAFKA_BROKERS` | ✅ | `localhost:9092` | Comma-separated Kafka broker list |
| `CACHE_ENABLED` | | `true` | Enable Redis response caching |
| `FALLBACK_ENABLED` | | `true` | Return fallback items on ranking failure |
| `RATE_LIMIT_ENABLED` | | `true` | Enable global rate limiting |
| `RATE_LIMIT_MAX` | | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | | `60000` | Rate limit window in ms |
| `FEATURE_ANALYTICS` | | `true` | Request-level analytics logging |

---

## Running Locally

**Prerequisites:** Node.js 20+, Docker

```bash
# 1. Clone and install
git clone https://github.com/marcos-astudillo/recoflow.git
cd recoflow
npm install

# 2. Configure environment
cp .env.example .env
# For local dev update URLs to use localhost:
# POSTGRES_URL=postgresql://user:password@localhost:5432/recoflow
# REDIS_URL=redis://localhost:6379
# KAFKA_BROKERS=localhost:9092

# 3. Start only infrastructure (no app container)
docker compose up postgres redis kafka zookeeper -d

# 4. Start the API with hot-reload
npm run dev
```

Open **http://localhost:3000/docs** for the Swagger UI.

**Quick smoke test:**
```bash
# Health check
curl http://localhost:3000/health

# Get recommendations
curl "http://localhost:3000/v1/recommendations?user_id=u_1&limit=5&context=home"

# Track an event
curl -X POST http://localhost:3000/v1/events \
  -H "Content-Type: application/json" \
  -d '{"type":"click","user_id":"u_1","item_id":"p_10","ts":"2024-01-15T10:30:00Z"}'
```

---

## Docker

**Start the full stack (app + postgres + redis + kafka):**

```bash
# First time or after code changes
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop and remove volumes (clean slate)
docker compose down -v
```

> **Port conflict?** If you see `port is already allocated` for Redis (6379) or PostgreSQL (5432),
> a previous container is still running. Fix it with:
> ```bash
> docker compose down
> docker compose up --build
> ```

**Build the production image only:**
```bash
docker build -t recoflow .
docker run -p 3000:3000 \
  -e POSTGRES_URL=... \
  -e REDIS_URL=... \
  -e KAFKA_BROKERS=... \
  recoflow
```

---

## Testing

```bash
# Run all tests (no Docker required — infra is mocked)
npm test

# Watch mode
npm run test -- --watch

# With coverage
npm run test -- --coverage
```

**Test suite:**

| File | Type | Coverage |
|---|---|---|
| `tests/api.test.ts` | API integration | Health, recommendations (200/400/limit/context/fields), events (202/400 all cases) |
| `tests/recomendation.test.ts` | Unit | Limit, response shape, score sorting, cache HIT/MISS, fallback, error propagation |

All tests mock Redis, PostgreSQL, and Kafka — no infrastructure needed.

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci-cd.yml`):

```
push to main → type-check (tsc) → tests (vitest) → build (tsc) → Docker build + push (ghcr.io)
```

1. **Build job**: type-check, run tests, compile TypeScript
2. **Docker job** (main branch only): build image and push to `ghcr.io/{owner}/recoflow:latest`
3. **Deploy job** (commented template): trigger a Render deploy webhook

### Deploy to Render

1. Create a **Web Service** on [render.com](https://render.com) connected to this repo (or pointing to the Docker image from ghcr.io)
2. Set all environment variables from `.env.example`
3. Copy the deploy hook URL → add as GitHub secret `RENDER_DEPLOY_HOOK_URL`
4. Uncomment the `deploy` job in `.github/workflows/ci-cd.yml`

---

## Scaling Considerations

Based on the [system design](https://github.com/marcos-astudillo/system-design-notes):

| Concern | Solution |
|---|---|
| **5k QPS recommendations** | Horizontal scaling — stateless API instances behind a load balancer |
| **p95 latency < 100ms** | Redis cache for low-entropy contexts (home page) + warm instances |
| **Feature store read amplification** | Batch Redis MGET for candidate popularity in a single round-trip |
| **Model serving latency** | Optimize model size, use fast runtime, pre-warm instances |
| **Feedback loops / bias** | Exploration constraints + diversity injection at ranking stage |
| **50k events/sec** | Kafka partitioned by `user_id` for ordered per-user processing |
| **Availability** | Multiple instances + `/health` liveness probe + graceful shutdown |
| **Rate limiting across replicas** | Configure `@fastify/rate-limit` with a Redis store instead of in-memory |

---

## System Design Reference

This implementation is based on the **Recommendation System** design from:

> 📐 [system-design-notes](https://github.com/marcos-astudillo/system-design-notes)

The design covers:
- Problem statement and functional requirements (10M users, 1M items, 5k QPS)
- High-level architecture with Mermaid diagrams
- Two-stage pipeline design and scaling strategy
- Trade-offs: accuracy vs latency, real-time vs batch, personalization vs privacy
- Possible improvements: contextual bandits, multi-objective ranking, A/B testing

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📫 Connect

<p align="center">
  <a href="https://www.marcosastudillo.com">
    <img src="https://img.shields.io/badge/Website-marcosastudillo.com-blueviolet?style=for-the-badge&logo=google-chrome" />
  </a>
  <a href="https://www.linkedin.com/in/marcos-astudillo-c/">
    <img src="https://img.shields.io/badge/LinkedIn-Marcos%20Astudillo-blue?style=for-the-badge&logo=linkedin" />
  </a>
  <a href="https://github.com/marcos-astudillo">
    <img src="https://img.shields.io/badge/GitHub-marcos--astudillo-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="mailto:m.astudillo1986@gmail.com">
    <img src="https://img.shields.io/badge/Email-m.astudillo1986%40gmail.com-red?style=for-the-badge&logo=gmail" />
  </a>
</p>
