import { z } from "zod";

export const createInviteSchema = z.object({
  gameName: z.string().min(1, "Name is required").max(80),
  hostName: z.string().min(1, "Host is required").max(80),
  date: z.string().min(1, "Date is required"),
  location: z.string().max(200).default(""),
  // A blank/omitted buy-in means "TBD" -- normalized to null before it
  // ever reaches the number check, so it doesn't fail validation as NaN.
  buyIn: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().min(0).nullable().default(null),
  ),
});

export type CreateInviteRequest = z.infer<typeof createInviteSchema>;

export const rsvpSchema = z.object({
  guestToken: z.string().min(1),
  name: z.string().min(1, "Name is required").max(80),
  status: z.enum(["in", "out", "maybe"]),
  eta: z.string().max(80).nullable().default(null),
});

export type RsvpRequest = z.infer<typeof rsvpSchema>;
