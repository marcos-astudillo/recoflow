import { FastifyInstance } from "fastify";
import { postEvent } from "../controllers/event.controller";

export async function eventRoutes(app: FastifyInstance) {
  app.post("/v1/events", postEvent);
}
