/**
 * Unit tests for the Recommendation Service.
 * All Redis/infra dependencies are mocked — no Docker required.
 *
 * Note: filename kept as-is to preserve git history.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Redis ───────────────────────────────────────────────────────────────
// vi.hoisted() ensures the object is created before vi.mock() hoisting runs
const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
}));

vi.mock("../src/infrastructure/redis.client", () => ({
  default: mockRedis,
}));

import { getRecommendationsService } from "../src/services/recommendation.service";

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Recommendation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Safe defaults — override per test as needed
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.incr.mockResolvedValue(1);
    process.env.CACHE_ENABLED = "false";
    process.env.FALLBACK_ENABLED = "true";
  });

  // ── Limit parameter ────────────────────────────────────────────────────────
  it("returns exactly N items according to the limit parameter", async () => {
    const result = await getRecommendationsService("u1", 5);
    expect(result.items).toHaveLength(5);
  });

  it("returns 20 items when limit=20 (default)", async () => {
    const result = await getRecommendationsService("u1", 20);
    expect(result.items).toHaveLength(20);
  });

  // ── Response shape ─────────────────────────────────────────────────────────
  it("each item has item_id, score, and reason fields", async () => {
    const result = await getRecommendationsService("u1", 3);
    for (const item of result.items) {
      expect(item).toHaveProperty("item_id");
      expect(typeof item.item_id).toBe("string");
      expect(item).toHaveProperty("score");
      expect(typeof item.score).toBe("number");
      expect(item).toHaveProperty("reason");
      expect(typeof item.reason).toBe("string");
    }
  });

  it("scores are sorted descending", async () => {
    const result = await getRecommendationsService("u1", 10);
    const scores = result.items.map((i) => i.score);
    for (let j = 1; j < scores.length; j++) {
      expect(scores[j]).toBeLessThanOrEqual(scores[j - 1]);
    }
  });

  // ── Cache: DISABLED ────────────────────────────────────────────────────────
  it("does NOT read from or write to Redis when CACHE_ENABLED=false", async () => {
    process.env.CACHE_ENABLED = "false";
    await getRecommendationsService("u1", 5);
    expect(mockRedis.set).not.toHaveBeenCalledWith(
      expect.stringContaining("recs:"),
      expect.any(String),
      expect.any(String),
      expect.any(Number),
    );
  });

  // ── Cache: HIT ─────────────────────────────────────────────────────────────
  it("returns cached response on cache HIT (CACHE_ENABLED=true)", async () => {
    process.env.CACHE_ENABLED = "true";
    const cached = JSON.stringify({
      items: [{ item_id: "cached_item", score: 0.99, reason: "cached" }],
    });
    mockRedis.get.mockResolvedValueOnce(cached); // first call = cache key hit

    const result = await getRecommendationsService("u1", 20);

    expect(result.items[0].item_id).toBe("cached_item");
    expect(mockRedis.set).not.toHaveBeenCalledWith(
      expect.stringContaining("recs:"),
      expect.any(String),
      "EX",
      expect.any(Number),
    );
  });

  // ── Cache: MISS ────────────────────────────────────────────────────────────
  it("stores result in Redis on cache MISS (CACHE_ENABLED=true)", async () => {
    process.env.CACHE_ENABLED = "true";
    // First get = cache miss; subsequent gets (popularity/user) = null
    mockRedis.get.mockResolvedValue(null);

    await getRecommendationsService("u1", 5);

    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining("recs:u1:"),
      expect.any(String),
      "EX",
      60,
    );
  });

  // ── Fallback ───────────────────────────────────────────────────────────────
  it("returns fallback popular items when ranking pipeline fails (FALLBACK_ENABLED=true)", async () => {
    process.env.CACHE_ENABLED = "false";
    process.env.FALLBACK_ENABLED = "true";
    // All redis.get calls inside generateCandidates will reject
    mockRedis.get.mockRejectedValue(new Error("Redis connection refused"));

    const result = await getRecommendationsService("u1", 3);

    expect(result.items).toHaveLength(3);
    expect(result.items[0].reason).toBe("fallback_popular");
    expect(result.items[0].score).toBe(0.5);
  });

  it("re-throws the error when pipeline fails and FALLBACK_ENABLED=false", async () => {
    process.env.CACHE_ENABLED = "false";
    process.env.FALLBACK_ENABLED = "false";
    mockRedis.get.mockRejectedValue(new Error("Redis down"));

    await expect(getRecommendationsService("u1", 5)).rejects.toThrow(
      "Redis down",
    );
  });

  // ── Different users ────────────────────────────────────────────────────────
  it("works for different user IDs", async () => {
    const r1 = await getRecommendationsService("user_A", 5);
    const r2 = await getRecommendationsService("user_B", 5);
    expect(r1.items).toHaveLength(5);
    expect(r2.items).toHaveLength(5);
  });
});
