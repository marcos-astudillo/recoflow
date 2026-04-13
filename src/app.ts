import Fastify from "fastify";
import { recommendationRoutes } from "./routes/recommendation.routes";
import { eventRoutes } from "./routes/event.routes";
import { registerSwagger } from "./config/swagger";
import { registerRateLimiter } from "./middleware/rateLimiter";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
    // Allow OpenAPI keywords (like 'example') inside validation schemas
    ajv: {
      customOptions: { strict: false },
    },
  });

  // ── Swagger (must register before routes) ─────────────────────────────────
  registerSwagger(app);

  // ── Rate limiter ──────────────────────────────────────────────────────────
  registerRateLimiter(app);

  // ── Request timing hooks ──────────────────────────────────────────────────
  app.addHook("onRequest", async (request) => {
    request.startTime = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const duration = Date.now() - (request.startTime || 0);
    request.log.info({
      msg: "request completed",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration_ms: duration,
    });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    request.log.error({ err: error }, "unhandled error");
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? "Internal Server Error" : error.message,
    });
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  app.get("/health", {
    schema: {
      tags: ["health"],
      summary: "Health check",
      description: "Returns 200 when the service is up.",
      response: {
        200: {
          type: "object",
          properties: { status: { type: "string", example: "ok" } },
          required: ["status"],
        },
      },
    },
    handler: async () => ({ status: "ok" }),
  });

  app.register(recommendationRoutes);
  app.register(eventRoutes);

  return app;
};
