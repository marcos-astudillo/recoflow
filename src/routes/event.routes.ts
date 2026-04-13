import { FastifyInstance } from "fastify";
import { postEvent } from "../controllers/event.controller";

export async function eventRoutes(app: FastifyInstance) {
  app.post("/v1/events", {
    schema: {
      tags: ["events"],
      summary: "Track a user interaction event",
      description:
        "Accepts a user interaction event (click, view, purchase). The event is persisted to PostgreSQL, counters are updated in Redis, and the raw event is published to the Kafka 'events' topic for the offline training pipeline.",
      body: {
        type: "object",
        required: ["type", "user_id", "item_id", "ts"],
        properties: {
          type: {
            type: "string",
            enum: ["click", "view", "purchase"],
            description: "Interaction type",
            example: "click",
          },
          user_id: {
            type: "string",
            description: "User identifier",
            example: "u_1",
          },
          item_id: {
            type: "string",
            description: "Item identifier",
            example: "p_10",
          },
          ts: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 timestamp of the event",
            example: "2024-01-15T10:30:00Z",
          },
        },
      },
      response: {
        202: {
          type: "object",
          description: "Event accepted for processing",
          properties: {
            status: { type: "string", example: "accepted" },
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
    handler: postEvent,
  });
}
