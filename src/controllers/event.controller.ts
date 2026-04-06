import { FastifyRequest, FastifyReply } from "fastify";
import { eventSchema } from "../models/event.model";
import { incrementItemPopularity } from "../repositories/itemFeature.repository";
import { incrementUserInteraction } from "../repositories/userFeature.repository";
import { insertEvent } from "../repositories/event.repository";
import { producer, connectProducer } from "../infrastructure/kafka.client";


export const postEvent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const parsed = eventSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error });
  }

  const event = parsed.data;

  await insertEvent(event);

  await incrementUserInteraction(event.user_id);
  await incrementItemPopularity(event.item_id);

  try {
    await connectProducer();
    await producer.send({
      topic: "events",
      messages: [{ value: JSON.stringify(event) }],
    });
    } catch (err) {
      console.error("Kafka publish error:", err);
    }

  return reply.status(202).send({ status: "accepted" });
};
