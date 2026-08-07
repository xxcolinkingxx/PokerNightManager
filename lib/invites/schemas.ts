import { z } from "zod";

// Shared by the create-invite form (as select options) and the schema
// (as the allow-list of valid values) so the two can't drift apart.
export const INVITE_EXPIRY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
] as const;

export const DEFAULT_INVITE_EXPIRY_DAYS = 90;

const VALID_INVITE_EXPIRY_DAYS: number[] = INVITE_EXPIRY_OPTIONS.map((option) => option.days);

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
  expiresInDays: z.coerce
    .number()
    .refine((value) => VALID_INVITE_EXPIRY_DAYS.includes(value), "Invalid expiration")
    .default(DEFAULT_INVITE_EXPIRY_DAYS),
});

export type CreateInviteRequest = z.infer<typeof createInviteSchema>;

export const rsvpSchema = z.object({
  guestToken: z.string().min(1),
  name: z.string().min(1, "Name is required").max(80),
  status: z.enum(["in", "out", "maybe"]),
  eta: z.string().max(80).nullable().default(null),
});

export type RsvpRequest = z.infer<typeof rsvpSchema>;
