import { z } from "zod";

/**
 * A checkbox that is absent from FormData when unchecked. Use this instead
 * of z.coerce.boolean() (which would treat "missing key" as its default,
 * not false) for any HTML checkbox bound to a zod schema.
 */
export const checkboxBoolean = z.preprocess(
  (v) => v === "true" || v === "on" || v === true,
  z.boolean()
);

/**
 * An optional numeric field bound to a text/number input. A blank input
 * submits "" (or FormData omits the key), which z.coerce.number() would
 * otherwise coerce to 0 — silently failing .min() bounds on a field the
 * user never touched. This normalizes "blank" to undefined first.
 */
export function optionalCoercedNumber<T extends z.ZodType<number, unknown>>(schema: T) {
  // .optional() must wrap the inner schema BEFORE preprocess, not after: ZodOptional's
  // "skip validation when undefined" fast-path only fires on the value it directly
  // receives. Applying .optional() outside preprocess means it only ever sees the raw
  // (pre-transform) value — "" isn't literally undefined, so it wouldn't short-circuit,
  // and undefined would then hit the non-optional coerced-number schema and fail.
  return z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    schema.optional()
  );
}

/**
 * A REQUIRED numeric field bound to a text/number input. Same root problem as
 * optionalCoercedNumber — Number("") is 0, not NaN — but here a blank input
 * must fail validation instead of silently becoming a "confirmed" 0 (e.g. a
 * blank "KM Driven" must not be accepted as an actual reading of zero km).
 * A blank field gets `requiredMessage`; a non-blank invalid value (e.g. "-5")
 * still gets the wrapped schema's own message (e.g. "KM must be zero or more.").
 */
export function requiredCoercedNumber<T extends z.ZodType<number, unknown>>(
  schema: T,
  requiredMessage: string
) {
  return z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.any())
    .transform((v, ctx) => {
      if (v === undefined) {
        ctx.addIssue({ code: "custom", message: requiredMessage });
        return z.NEVER;
      }
      return v;
    })
    .pipe(schema);
}
