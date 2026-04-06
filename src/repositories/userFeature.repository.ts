import redis from "../infrastructure/redis.client";

export const incrementUserInteraction = async (userId: string) => {
  const key = `user:${userId}:interactions`;
  await redis.incr(key);
};

export const getUserInteractionCount = async (userId: string) => {
  const key = `user:${userId}:interactions`;
  const val = await redis.get(key);
  return val ? parseInt(val) : 0;
};
