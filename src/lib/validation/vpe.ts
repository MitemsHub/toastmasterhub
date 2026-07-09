import { z } from "zod";

export const vpeSignupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  signupOtc: z.string().trim().min(4).max(64),
});

export const accessCodeSchema = z.object({
  accessCode: z.string().trim().min(6).max(32),
});

export type VpeSignupInput = z.infer<typeof vpeSignupSchema>;
