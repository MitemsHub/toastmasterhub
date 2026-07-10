import { z } from "zod";

function hasLocalHostname(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    APPWRITE_ENDPOINT: z.url(),
    APPWRITE_PROJECT_ID: z.string().trim().min(1),
    APPWRITE_API_KEY: z.string().trim().min(1),
    APPWRITE_DATABASE_ID: z.string().trim().min(1),
    APPWRITE_VPES_COLLECTION_ID: z.string().trim().min(1),
    APPWRITE_EVALUATORS_COLLECTION_ID: z.string().trim().min(1),
    APPWRITE_INVITATIONS_COLLECTION_ID: z.string().trim().min(1),
    APPWRITE_STORAGE_BUCKET_ID: z.string().trim().min(1),
    VPE_SIGNUP_OTC: z.string().trim().min(4),
    SMTP_HOST: z.string().trim().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.email(),
    SMTP_PASS: z.string().min(1),
    SMTP_FROM: z.email(),
    APP_BASE_URL: z.url(),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV !== "production") {
      return;
    }

    if (hasLocalHostname(input.APPWRITE_ENDPOINT)) {
      ctx.addIssue({
        code: "custom",
        message: "APPWRITE_ENDPOINT must be a public URL in production.",
        path: ["APPWRITE_ENDPOINT"],
      });
    }

    if (hasLocalHostname(input.APP_BASE_URL)) {
      ctx.addIssue({
        code: "custom",
        message: "APP_BASE_URL must be a public URL in production.",
        path: ["APP_BASE_URL"],
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(): AppEnv {
  return parseEnv(process.env);
}
