export const generateCandidates = async (userId: string) => {
  // mock: generar 200 items
  return Array.from({ length: 200 }, (_, i) => ({
    item_id: `item_${i}`,
    base_score: Math.random(),
  }));
};
