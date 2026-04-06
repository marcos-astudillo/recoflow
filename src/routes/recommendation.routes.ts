import { FastifyInstance } from "fastify";
import { getRecommendations } from "../controllers/recommendation.controller";

export async function recommendationRoutes(app: FastifyInstance) {
  app.get("/v1/recommendations", getRecommendations);
}
