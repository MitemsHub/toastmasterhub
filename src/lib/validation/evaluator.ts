import { z } from "zod";

export const evaluatorSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().trim().min(7).max(32),
  profile: z.string().trim().min(10).max(500),
  photoPath: z.string().trim().min(1),
});

export type EvaluatorInput = z.infer<typeof evaluatorSchema>;
