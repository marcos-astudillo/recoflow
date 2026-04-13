import "dotenv/config";
import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
