import { z } from "zod";

export const contactLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  projectType: z.string().trim().min(3).max(80),
  message: z.string().trim().min(12).max(1200),
});

export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
