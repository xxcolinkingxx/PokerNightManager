import { z } from "zod";

export const chipDefinitionSchema = z.object({
  color: z.string().min(1),
  label: z.string().min(1, "Label is required").max(30),
  value: z.coerce.number().min(1, "Must be at least $1"),
  quantityOwned: z.coerce.number().min(0, "Can't be negative"),
});

export const chipSetFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  chips: z.array(chipDefinitionSchema).min(1, "Add at least one denomination"),
});

// z.coerce fields make the schema's input type (pre-coercion, `unknown`)
// differ from its output type (post-coercion, `number`) -- useForm needs
// the input shape so its generic matches what zodResolver actually infers.
export type ChipSetFormInput = z.input<typeof chipSetFormSchema>;
export type ChipSetFormValues = z.output<typeof chipSetFormSchema>;
