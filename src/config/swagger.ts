import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";

export const registerSwagger = async (app: FastifyInstance) => {
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Recoflow API",
        description:
          "Production-grade recommendation system API. Provides personalized item recommendations and collects user interaction events to feed the ML training pipeline.",
        version: "1.0.0",
        contact: {
          name: "Recoflow",
          url: "https://github.com/marcos-astudillo/recoflow",
        },
      },
      tags: [
        {
          name: "recommendations",
          description:
            "Personalized item recommendations (two-stage: candidate generation + ranking)",
        },
        {
          name: "events",
          description:
            "User interaction events (click, view, purchase) fed into the streaming pipeline",
        },
        { name: "health", description: "Service health and readiness" },
      ],
      components: {
        schemas: {
          RecommendationItem: {
            type: "object",
            properties: {
              item_id: {
                type: "string",
                example: "p_10",
                description: "Unique item identifier",
              },
              score: {
                type: "number",
                format: "float",
                example: 0.91,
                description: "Relevance score (0–1)",
              },
              reason: {
                type: "string",
                example: "because_you_viewed",
                description: "Explanation label for the recommendation",
              },
            },
            required: ["item_id", "score", "reason"],
          },
          RecommendationResponse: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/RecommendationItem" },
              },
            },
            required: ["items"],
          },
          EventRequest: {
            type: "object",
            required: ["type", "user_id", "item_id", "ts"],
            properties: {
              type: {
                type: "string",
                enum: ["click", "view", "purchase"],
                example: "click",
                description: "Interaction type",
              },
              user_id: {
                type: "string",
                example: "u_1",
                description: "User identifier",
              },
              item_id: {
                type: "string",
                example: "p_10",
                description: "Item identifier",
              },
              ts: {
                type: "string",
                format: "date-time",
                example: "2024-01-15T10:30:00Z",
                description: "ISO 8601 timestamp of the event",
              },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: {
                description: "Error details",
              },
            },
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
  });
};
