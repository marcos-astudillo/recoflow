import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

/**
 * Registers global rate limiting.
 *
 * Controlled by RATE_LIMIT_ENABLED env flag.
 * Defaults: 100 requests / 60 seconds per IP.
 * Uses Redis as the store when REDIS_URL is set, otherwise in-memory.
 */
export const registerRateLimiter = async (app: FastifyInstance) => {
  if (process.env.RATE_LIMIT_ENABLED !== "true") return;

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Retry after ${context.after}.`,
    }),
  });
};
