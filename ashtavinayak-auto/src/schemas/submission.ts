import { z } from "zod";
import { vehicleTypeEnum, fuelTypeEnum, transmissionEnum, conditionEnum } from "./vehicle";
import { checkboxBoolean, optionalCoercedNumber, requiredCoercedNumber } from "@/lib/zod-helpers";

const currentYear = new Date().getFullYear();

export const ownerDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid mobile number."),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().optional().or(z.literal("")),
  preferredContact: z.enum(["PHONE", "WHATSAPP", "EMAIL"]).default("WHATSAPP"),
});

export const submissionVehicleDetailsSchema = z.object({
  vehicleType: vehicleTypeEnum,
  brand: z.string().trim().min(1, "Brand is required."),
  model: z.string().trim().min(1, "Model is required."),
  variant: z.string().trim().optional().or(z.literal("")),
  year: requiredCoercedNumber(
    z.coerce.number().int().min(1980).max(currentYear + 1, "Year is not reasonable."),
    "Manufacturing year is required."
  ),
  registrationYear: optionalCoercedNumber(z.coerce.number().int().min(1980).max(currentYear + 1)),
  registrationNumber: z.string().trim().optional().or(z.literal("")),
  kilometres: requiredCoercedNumber(
    z.coerce.number().int().min(0, "KM must be zero or more."),
    "KM driven is required."
  ),
  fuelType: fuelTypeEnum,
  transmission: transmissionEnum.optional(),
  engine: z.string().trim().optional().or(z.literal("")),
  color: z.string().trim().optional().or(z.literal("")),
  owners: optionalCoercedNumber(z.coerce.number().int().min(1).max(10)),
  condition: conditionEnum.optional(),
});

export const submissionPriceLocationSchema = z.object({
  expectedPrice: optionalCoercedNumber(z.coerce.number().int().min(0)),
  isPriceNegotiable: checkboxBoolean,
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().optional().or(z.literal("")),
  pincode: z.string().trim().optional().or(z.literal("")),
  vehicleLocation: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  rcAvailable: checkboxBoolean,
  insuranceAvailable: checkboxBoolean,
  pucAvailable: checkboxBoolean,
  serviceHistoryAvailable: checkboxBoolean,
  hasLoan: checkboxBoolean,
});

export const submissionConsentSchema = z.object({
  // FormData always stringifies values ("true"/"false"), so this must be
  // preprocessed the same way as checkboxBoolean before checking it's literally true.
  consent: z.preprocess(
    (v) => v === "true" || v === "on" || v === true,
    z.literal(true, {
      error: "You must confirm the information is accurate before submitting.",
    })
  ),
  // Honeypot: must stay empty; bots that fill every field will trip this.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const submissionSchema = ownerDetailsSchema
  .merge(submissionVehicleDetailsSchema)
  .merge(submissionPriceLocationSchema)
  .merge(submissionConsentSchema);

export type SubmissionInput = z.infer<typeof submissionSchema>;
/** Raw (pre-coercion) shape for react-hook-form's TFieldValues — see VehicleFormValues for why. */
export type SubmissionValues = z.input<typeof submissionSchema>;
