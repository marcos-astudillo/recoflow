import { db } from "../infrastructure/db.client";

export const insertEvent = async (event: {
  type: string;
  user_id: string;
  item_id: string;
  ts: string;
}) => {
  await db.query(
    `INSERT INTO events(type, user_id, item_id, ts)
     VALUES($1, $2, $3, $4)`,
    [event.type, event.user_id, event.item_id, event.ts],
  );
};
