import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "recoflow-app",
  // Supports comma-separated broker list, e.g. "kafka:29092" (Docker) or "localhost:9092" (local)
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};
