import { z } from "zod";

const envSchema = z.object({
  POCKETBASE_URL: z.url(),
  POCKETBASE_ADMIN_EMAIL: z.email(),
  POCKETBASE_ADMIN_PASSWORD: z.string().min(8),
  VPE_SIGNUP_OTC: z.string().trim().min(4),
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.email(),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.email(),
  APP_BASE_URL: z.url(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  return parseEnv(process.env);
}
