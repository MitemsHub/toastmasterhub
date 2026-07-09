import { z } from "zod";

export const evaluatorSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  profile: z.string().trim().min(10).max(500),
  photoPath: z.string().trim().min(1),
});

export type EvaluatorInput = z.infer<typeof evaluatorSchema>;
