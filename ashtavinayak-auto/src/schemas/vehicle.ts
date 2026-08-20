import { z } from "zod";
import { checkboxBoolean, optionalCoercedNumber, requiredCoercedNumber } from "@/lib/zod-helpers";

export const vehicleTypeEnum = z.enum(["CAR", "BIKE", "SCOOTER", "BUS", "COMMERCIAL", "OTHER"], {
  error: "Select a vehicle type.",
});
export const fuelTypeEnum = z.enum(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "LPG", "OTHER"], {
  error: "Select a fuel type.",
});
export const transmissionEnum = z.enum(["MANUAL", "AUTOMATIC", "AMT", "CVT", "DCT", "OTHER"], {
  error: "Select a transmission.",
});
export const conditionEnum = z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_REPAIR"], {
  error: "Select a condition.",
});

const currentYear = new Date().getFullYear();

export const vehicleFormSchema = z.object({
  categoryId: z.string().min(1, "Select a category."),
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
  price: requiredCoercedNumber(z.coerce.number().int().min(0, "Price must be zero or more."), "Price is required."),
  ownerExpectedPrice: optionalCoercedNumber(z.coerce.number().int().min(0)),
  adminValuation: optionalCoercedNumber(z.coerce.number().int().min(0)),
  negotiatedPrice: optionalCoercedNumber(z.coerce.number().int().min(0)),
  isPriceNegotiable: checkboxBoolean,
  kilometres: requiredCoercedNumber(
    z.coerce.number().int().min(0, "KM must be zero or more."),
    "KM driven is required."
  ),
  fuelType: fuelTypeEnum,
  transmission: transmissionEnum.optional(),
  engine: z.string().trim().optional().or(z.literal("")),
  mileage: z.string().trim().optional().or(z.literal("")),
  owners: optionalCoercedNumber(z.coerce.number().int().min(1).max(10)),
  color: z.string().trim().optional().or(z.literal("")),
  condition: conditionEnum.optional(),
  location: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  rcAvailable: checkboxBoolean,
  insuranceAvailable: checkboxBoolean,
  pucAvailable: checkboxBoolean,
  serviceHistoryAvailable: checkboxBoolean,
  hasLoan: checkboxBoolean,
  isFeatured: checkboxBoolean,
  featureIds: z.array(z.string()).default([]),
});
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;
/** Raw (pre-coercion) shape used by react-hook-form's TFieldValues, since several
 * fields use z.coerce — their input type differs from the validated output type. */
export type VehicleFormValues = z.input<typeof vehicleFormSchema>;
