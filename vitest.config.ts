import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Makes it, expect, describe, vi, etc. available globally — no need to import them
    globals: true,
    environment: "node",
    // Default env vars for every test run (no real infra required)
    env: {
      PORT: "3000",
      POSTGRES_URL: "postgresql://user:password@localhost:5432/recoflow",
      REDIS_URL: "redis://localhost:6379",
      KAFKA_BROKERS: "localhost:9092",
      CACHE_ENABLED: "false",
      FALLBACK_ENABLED: "true",
      RATE_LIMIT_ENABLED: "false",
    },
  },
});
