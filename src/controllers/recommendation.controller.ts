import { FastifyRequest, FastifyReply } from "fastify";
import { recommendationQuerySchema } from "../models/recommendation.model";

export const getRecommendations = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const parsed = recommendationQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error });
  }

  const { user_id, limit, context } = parsed.data;

  // TODO: conectar con service
  return {
    items: [],
  };
};
