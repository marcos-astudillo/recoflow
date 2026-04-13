import { FastifyInstance } from "fastify";
import { getRecommendations } from "../controllers/recommendation.controller";

export async function recommendationRoutes(app: FastifyInstance) {
  app.get("/v1/recommendations", {
    schema: {
      tags: ["recommendations"],
      summary: "Get personalized recommendations",
      description:
        "Returns a ranked list of items for a given user. Uses a two-stage pipeline: ANN-based candidate generation followed by ML ranking. Responses are cached (TTL 60s) for low-entropy contexts. Falls back to popular items if the ranking service degrades.",
      querystring: {
        type: "object",
        required: ["user_id"],
        properties: {
          user_id: {
            type: "string",
            description: "User identifier",
            example: "u_1",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
            description: "Number of items to return",
          },
          context: {
            type: "string",
            description: 'Surface context (e.g. "home", "search", "pdp")',
            example: "home",
          },
        },
      },
      response: {
        200: {
          type: "object",
          description: "Ranked recommendation list",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_id: { type: "string" },
                  score:   { type: "number" },
                  reason:  { type: "string" },
                },
              },
            },
          },
        },
        400: {
          type: "object",
          description: "Validation error",
          properties: {
            error: { description: "Error details" },
          },
        },
        500: {
          type: "object",
          description: "Internal server error",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    handler: getRecommendations,
  });
}
