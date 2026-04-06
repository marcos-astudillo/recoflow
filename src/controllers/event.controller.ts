import { FastifyRequest, FastifyReply } from "fastify";
import { eventSchema } from "../models/event.model";

export const postEvent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const parsed = eventSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error });
  }

  const event = parsed.data;

  // TODO: enviar a event pipeline
  return reply.status(202).send({ status: "accepted" });
};
