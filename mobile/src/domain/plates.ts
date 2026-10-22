export const plateSizes = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const plateColors: Record<number, string> = {
  25: "#D42A2A",
  20: "#2A62D4",
  15: "#F2C200",
  10: "#1F9A56",
  5: "#E8E8E8",
  2.5: "#D42A2A",
  1.25: "#B8B8B8",
};
export function loadPlates(
  totalKg: number,
  barKg = 20,
  selectedPairs?: readonly number[],
) {
  if (!Number.isFinite(totalKg) || totalKg < 0 || ![15, 20].includes(barKg))
    throw new Error("Invalid bar load.");
  let rest = Math.max(0, (totalKg - barKg) / 2);
  const pairs: number[] = selectedPairs ? [...selectedPairs] : [];
  if (selectedPairs) {
    if (
      pairs.length > 24 ||
      pairs.some((p) => !plateSizes.some((size) => size === p))
    )
      throw new Error("Choose supported plate sizes, with at most 24 pairs.");
    if (Math.abs(totalLoad(pairs, barKg) - totalKg) > 0.01)
      throw new Error("Selected plates must match the recorded load.");
  } else {
    for (const plate of plateSizes)
      while (rest >= plate - 1e-8 && pairs.length < 24) {
        pairs.push(plate);
        rest -= plate;
      }
  }
  const representedKg = barKg + 2 * pairs.reduce((a, b) => a + b, 0);
  return {
    pairs,
    representedKg,
    remainderKg: Math.max(0, totalKg - representedKg),
    belowBar: totalKg < barKg,
  };
}
export function totalLoad(pairs: number[], barKg: number) {
  return barKg + 2 * pairs.reduce((a, b) => a + b, 0);
}
