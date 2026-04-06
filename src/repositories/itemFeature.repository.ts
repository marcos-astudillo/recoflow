import redis from "../infrastructure/redis.client";

export const incrementItemPopularity = async (itemId: string) => {
  const key = `item:${itemId}:popularity`;
  await redis.incr(key);
};

export const getItemPopularity = async (itemId: string) => {
  const val = await redis.get(`item:${itemId}:popularity`);
  return val ? parseInt(val) : 0;
};
