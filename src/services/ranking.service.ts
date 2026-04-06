export const rankItems = async (
  candidates: { item_id: string; base_score: number }[],
  limit: number,
) => {
  return candidates
    .map((c) => ({
      item_id: c.item_id,
      score: c.base_score + Math.random() * 0.1,
      reason: "personalized",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
