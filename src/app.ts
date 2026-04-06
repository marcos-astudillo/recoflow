import Fastify from "fastify";
import { recommendationRoutes } from "./routes/recommendation.routes";
import { eventRoutes } from "./routes/event.routes";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(recommendationRoutes);
  app.register(eventRoutes);

  return app;
};