import { z } from "zod";

/**
 * Poll creation validation schema
 */
export const createPollSchema = z.object({
  question: z.string().trim().min(3).max(200),
  options: z
    .array(z.string().trim().min(1).max(100))
    .min(2)
    .max(10)
    .refine(
      (options) =>
        new Set(options.map((option) => option.toLocaleLowerCase())).size === options.length,
      "Options must be unique",
    ),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

/**
 * Poll vote validation schema
 */
export const votePollSchema = z.object({
  optionId: z.string().uuid(),
});

export type VotePollInput = z.infer<typeof votePollSchema>;
