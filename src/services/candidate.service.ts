import { getItemPopularity } from "../repositories/itemFeature.repository";

export const generateCandidates = async (userId: string) => {
  const totalItems = 500; // en producción sería millones
  const candidates: { item_id: string; base_score: number }[] = [];

  // 1. Top populars
  for (let i = 0; i < 100; i++) {
    const item_id = `popular_${i}`;
    const popularity = await getItemPopularity(item_id);
    candidates.push({ item_id, base_score: popularity });
  }

  // 2. Recents (mock)
  for (let i = 100; i < 200; i++) {
    candidates.push({ item_id: `recent_${i}`, base_score: Math.random() });
  }

  // 3. Equals (mock)
  for (let i = 200; i < 250; i++) {
    candidates.push({ item_id: `similar_${i}`, base_score: Math.random() });
  }

  return candidates;
};
