import { getUserInteractionCount } from "../repositories/userFeature.repository";

export const rankItems = async (
  candidates: { item_id: string; base_score: number }[],
  userId: string,
  limit: number,
) => {
  const userActivity = await getUserInteractionCount(userId);

  return candidates
    .map((c) => ({
      item_id: c.item_id,
      // score = base_score * log(1 + userActivity)
      score: c.base_score * Math.log(1 + userActivity + 1),
      reason: "personalized",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
