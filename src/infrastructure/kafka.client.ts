import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "recoflow-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};
