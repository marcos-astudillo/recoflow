import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildApp } from "../src/app";

// ─── Mock infrastructure (no real Redis / Postgres / Kafka needed) ────────────
vi.mock("../src/infrastructure/redis.client", () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue("OK"),
  },
}));

vi.mock("../src/infrastructure/db.client", () => ({
  db: {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  },
}));

vi.mock("../src/infrastructure/kafka.client", () => ({
  producer: {
    connect: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
  connectProducer: vi.fn().mockResolvedValue(undefined),
}));

// ─── Health ───────────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });
});

// ─── Recommendations ──────────────────────────────────────────────────────────
describe("GET /v1/recommendations", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it("returns 200 with an items array for a valid user_id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: unknown[] }>();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("defaults to limit=20 when no limit is provided", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ items: unknown[] }>().items).toHaveLength(20);
  });

  it("respects the limit query parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1&limit=5",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ items: unknown[] }>().items).toHaveLength(5);
  });

  it("each item has item_id, score, and reason fields", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1&limit=3",
    });
    expect(res.statusCode).toBe(200);
    for (const item of res.json<{ items: Record<string, unknown>[] }>().items) {
      expect(item).toHaveProperty("item_id");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("reason");
    }
  });

  it("returns 400 when user_id is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations",
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts an optional context parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1&context=home",
    });
    expect(res.statusCode).toBe(200);
  });

  it("enforces maximum limit of 100", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/recommendations?user_id=u1&limit=101",
    });
    // Zod coercion rejects limit > 100
    expect(res.statusCode).toBe(400);
  });
});

// ─── Events ───────────────────────────────────────────────────────────────────
describe("POST /v1/events", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it("returns 202 for a valid click event", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "click",
        user_id: "u1",
        item_id: "p10",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toMatchObject({ status: "accepted" });
  });

  it("returns 202 for a valid view event", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "view",
        user_id: "u2",
        item_id: "p20",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(202);
  });

  it("returns 202 for a valid purchase event", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "purchase",
        user_id: "u3",
        item_id: "p30",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(202);
  });

  it("returns 400 for an unknown event type", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "share",
        user_id: "u1",
        item_id: "p10",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when user_id is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "click",
        item_id: "p10",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when item_id is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "click",
        user_id: "u1",
        ts: "2024-01-15T10:30:00Z",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for a malformed timestamp", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        type: "click",
        user_id: "u1",
        item_id: "p10",
        ts: "not-a-timestamp",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when the body is empty", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
