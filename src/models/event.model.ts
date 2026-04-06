import { z } from "zod";

export const eventSchema = z.object({
  type: z.enum(["click", "view", "purchase"]),
  user_id: z.string(),
  item_id: z.string(),
  ts: z.string().datetime(),
});

export type Event = z.infer<typeof eventSchema>;
