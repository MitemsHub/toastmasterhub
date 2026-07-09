import { describe, expect, it } from "vitest";
import { parseEnv } from "./config";

describe("parseEnv", () => {
  it("accepts a valid PocketBase and SMTP configuration", () => {
    const result = parseEnv({
      POCKETBASE_URL: "http://127.0.0.1:8090",
      POCKETBASE_ADMIN_EMAIL: "admin@example.com",
      POCKETBASE_ADMIN_PASSWORD: "super-secret-password",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      APP_BASE_URL: "http://localhost:3000",
    });

    expect(result.POCKETBASE_URL).toBe("http://127.0.0.1:8090");
    expect(result.SMTP_PORT).toBe(587);
  });

  it("rejects invalid email configuration", () => {
    expect(() =>
      parseEnv({
        POCKETBASE_URL: "http://127.0.0.1:8090",
        POCKETBASE_ADMIN_EMAIL: "not-an-email",
        POCKETBASE_ADMIN_PASSWORD: "super-secret-password",
        VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_USER: "club@example.com",
        SMTP_PASS: "app-password",
        SMTP_FROM: "club@example.com",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow();
  });
});
