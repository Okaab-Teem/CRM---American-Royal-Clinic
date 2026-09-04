import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  companyName: z.string().min(1, "Company is required."),
  email: z.string().email("Email must be valid.").optional().or(z.literal("")),
  phone: z.string().optional(),
  sourceName: z.string().min(1, "Source is required."),
  estimatedValue: z.coerce.number().min(0, "Estimated value cannot be negative.").optional(),
  notes: z.string().optional(),
});
