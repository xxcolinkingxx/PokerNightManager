import { z } from "zod";

export const detailsStepSchema = z.object({
  name: z.string().min(1, "Session name is required").max(100),
  host: z.string().min(1, "Host is required").max(100),
  location: z.string().min(1, "Location is required").max(200),
});

export const gameTypeStepSchema = z.object({
  type: z.enum(["cash", "tournament"]),
});

export const stakesStepSchema = z.object({
  buyIn: z.coerce.number().min(1, "Buy-in must be at least $1"),
  startingStack: z.coerce.number().min(1, "Starting stack must be at least 1"),
});

export const chipSetStepSchema = z.object({
  chipSetId: z.string().min(1, "Select a chip set"),
});

export const blindsStepSchema = z.object({
  blindStructureId: z.string().min(1, "Select a blind structure"),
});

export const playersStepSchema = z.object({
  playerIds: z.array(z.string()).min(2, "Select at least 2 players"),
});

export const wizardSchema = detailsStepSchema
  .merge(gameTypeStepSchema)
  .merge(stakesStepSchema)
  .merge(chipSetStepSchema)
  .merge(blindsStepSchema)
  .merge(playersStepSchema);

export type WizardSchemaValues = z.infer<typeof wizardSchema>;

export type DetailsStepValues = z.infer<typeof detailsStepSchema>;
export type GameTypeStepValues = z.infer<typeof gameTypeStepSchema>;
export type StakesStepValues = z.infer<typeof stakesStepSchema>;
export type ChipSetStepValues = z.infer<typeof chipSetStepSchema>;
export type BlindsStepValues = z.infer<typeof blindsStepSchema>;
export type PlayersStepValues = z.infer<typeof playersStepSchema>;
