# Strength standards import

PRISM currently ships no normative strength tables. Import only data you have permission to use. The five tier names are Beginner, Novice, Intermediate, Advanced and Elite. The application displays the supplied source name rather than claiming its own norms.

Use JSON with this structure. The numbers below are **synthetic format examples, not strength recommendations or population standards**.

```json
{
  "version": 1,
  "source": "Synthetic example — replace with your permitted source",
  "sourceUrl": null,
  "tables": [
    {
      "id": "example-bench-male-18-39",
      "exerciseId": "bench",
      "comparisonGroup": "male",
      "ageMin": 18,
      "ageMax": 39,
      "rows": [
        { "bodyweightKg": 60, "thresholdsKg": [30, 50, 70, 90, 110] },
        { "bodyweightKg": 100, "thresholdsKg": [50, 70, 90, 110, 130] }
      ]
    }
  ]
}
```

The table uses canonical exercise IDs from `mobile/src/data/catalog.ts`. Weights are kilograms, including dumbbell values per dumbbell and bodyweight movements as added load. `comparisonGroup` must be male or female; an unset PR group has no tier. Both age boundaries may be null for an all-age table. Age-specific tables require an age snapshot on the record. Age ranges for the same exercise and group must not overlap.

Each table requires at least two rows. Bodyweight rows must strictly increase; each row's five tier thresholds must strictly increase. Unknown exercise IDs, duplicate/overlapping cohorts, malformed rows and invalid numbers are rejected before replacing current standards.

For a covered PR bodyweight, each tier threshold is linearly interpolated between its adjacent rows. Values outside the bodyweight or age coverage produce no tier. A tier is the highest threshold reached. The next-tier gap uses the same interpolated thresholds. There is no inferred percentile such as “stronger than 66%.”

Measured singles are used as recorded. When no measured single is available for a lift, PRISM estimates 1RM from its best rep record: Brzycki for 2–10 reps (`weight × 36 / (37 − reps)`) and Epley for 11–12 (`weight × (1 + reps / 30)`). Estimates are labeled and never overwrite the original weight/reps. These estimates are not measurements.
