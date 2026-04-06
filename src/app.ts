import Fastify from "fastify";
import { recommendationRoutes } from "./routes/recommendation.routes";
import { eventRoutes } from "./routes/event.routes";

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

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

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(recommendationRoutes);
  app.register(eventRoutes);

  return app;
};