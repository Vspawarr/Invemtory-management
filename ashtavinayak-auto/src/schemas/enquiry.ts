import { z } from "zod";

export const enquirySchema = z.object({
  vehicleId: z.string().optional(),
  name: z.string().trim().min(2, "Enter your name."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid mobile number."),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const callbackSchema = z.object({
  vehicleId: z.string().optional(),
  name: z.string().trim().min(2, "Enter your name."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid mobile number."),
  preferredTime: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});
export type CallbackInput = z.infer<typeof callbackSchema>;
