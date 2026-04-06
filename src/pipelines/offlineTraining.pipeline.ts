import { db } from "../infrastructure/db.client";
import fs from "fs";
import path from "path";

// export dataset daily
export const generateTrainingDataset = async () => {
  const res = await db.query(
    `SELECT user_id, item_id, type, ts FROM events WHERE ts >= NOW() - INTERVAL '1 day'`,
  );

  const dataset = res.rows.map((r) => ({
    user_id: r.user_id,
    item_id: r.item_id,
    label: r.type === "click" ? 1 : 0,
  }));

  fs.writeFileSync(
    path.join(__dirname, "../../data/training_dataset.json"),
    JSON.stringify(dataset),
  );
};
