import { generateCandidates } from "./candidate.service";
import { rankItems } from "./ranking.service";
import redis from "../infrastructure/redis.client";

const CACHE_TTL = 60; // seconds

export const getRecommendationsService = async (
  userId: string,
  limit: number,
  context?: string,
) => {
  const cacheKey = `recs:${userId}:${context || "default"}`;

  if (process.env.CACHE_ENABLED === "true") {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  try {
    const candidates = await generateCandidates(userId);
    const ranked = await rankItems(candidates, userId, limit);
    const response = { items: ranked };

    if (process.env.CACHE_ENABLED === "true") {
      await redis.set(cacheKey, JSON.stringify(response), "EX", CACHE_TTL);
    }

    return response;
  } catch (error) {
    if (process.env.FALLBACK_ENABLED === "true") {
      return fallbackRecommendations(limit);
    }
    throw error;
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
