import { z } from "zod";

/**
 * An optional numeric form field. React Hook Form's `valueAsNumber` turns an
 * empty input into `NaN` (not `undefined`), which z.coerce.number() rejects
 * outright — so treat NaN as "not provided" before validating.
 */
export function optionalNumber(schema: z.ZodNumber = z.number()) {
  return z.preprocess((val) => (typeof val === "number" && Number.isNaN(val) ? undefined : val), schema.optional());
}
