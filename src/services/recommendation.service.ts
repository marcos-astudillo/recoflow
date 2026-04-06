import redis from "../infrastructure/redis.client";
import { generateCandidates } from "./candidate.service";
import { rankItems } from "./ranking.service";

const CACHE_TTL = 60; // seconds

export const getRecommendationsService = async (
  userId: string,
  limit: number,
  context?: string,
) => {
  const cacheKey = `recs:${userId}:${context || "default"}`;

  // 1. CACHE
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    // 2. Candidate generation
    const candidates = await generateCandidates(userId);

    // 3. Ranking
    const ranked = await rankItems(candidates, limit);

    const response = { items: ranked };

    // 4. Save cache
    await redis.set(cacheKey, JSON.stringify(response), "EX", CACHE_TTL);

    return response;
  } catch (error) {
    // 5. Fallback
    return fallbackRecommendations(limit);
  }
};

const fallbackRecommendations = (limit: number) => {
  return {
    items: Array.from({ length: limit }, (_, i) => ({
      item_id: `popular_${i}`,
      score: 0.5,
      reason: "fallback_popular",
    })),
  };
};
