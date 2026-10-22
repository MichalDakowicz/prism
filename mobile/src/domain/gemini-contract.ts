import { z } from "zod";
import { coachReplySchema } from "./schema";

// Keep the decoding grammar small. Full bounds and semantic checks still run
// against coachReplySchema and validatePlan before any proposal reaches the UI.
export function geminiResponseSchema() {
  const schema = z.toJSONSchema(coachReplySchema);
  const omitted = new Set([
    "$schema",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "minimum",
    "maximum",
  ]);
  function compact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(compact);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !omitted.has(key))
          .map(([key, item]) => [key, compact(item)]),
      );
    return value;
  }
  return compact(schema);
}
