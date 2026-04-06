import { z } from "zod";

export const recommendationQuerySchema = z.object({
  user_id: z.string(),
  limit: z.coerce.number().min(1).max(100).default(20),
  context: z.string().optional(),
});

export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
