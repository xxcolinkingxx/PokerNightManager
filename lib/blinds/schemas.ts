import { z } from "zod";

export const blindLevelSchema = z.object({
  level: z.coerce.number().int().min(1),
  // Sub-dollar blinds are real stakes (0.25/0.50 home games), so the
  // floor here is a cent, not a dollar.
  smallBlind: z.coerce.number().min(0.01, "Must be greater than $0"),
  bigBlind: z.coerce.number().min(0.01, "Must be greater than $0"),
  ante: z.coerce.number().min(0, "Can't be negative"),
  durationMinutes: z.coerce.number().min(1, "Must be at least 1 minute"),
});

export const blindStructureFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  levels: z.array(blindLevelSchema).min(1, "Add at least one level"),
});

// Same z.coerce split as the chip set schema -- useForm needs the
// pre-coercion input shape so its generic matches what zodResolver infers.
export type BlindStructureFormInput = z.input<typeof blindStructureFormSchema>;
export type BlindStructureFormValues = z.output<typeof blindStructureFormSchema>;
