import { describe, expect, it } from "vitest";
import { parseEnv } from "./config";

describe("parseEnv", () => {
  it("accepts a valid Appwrite and SMTP configuration", () => {
    const result = parseEnv({
      NODE_ENV: "development",
      APPWRITE_PROJECT_ID: "toastmasters-hub",
      APPWRITE_API_KEY: "secret-api-key",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      SMTP_PORT: "587",
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
    });

    expect(result.APPWRITE_PROJECT_ID).toBe("toastmasters-hub");
    expect(result.SMTP_PORT).toBe(587);
  });

  it("rejects invalid email configuration", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "development",
        APPWRITE_PROJECT_ID: "toastmasters-hub",
        APPWRITE_API_KEY: "secret-api-key",
        VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
        SMTP_PORT: "587",
        SMTP_USER: "club@example.com",
        SMTP_PASS: "app-password",
        SMTP_FROM: "not-an-email",
      }),
    ).toThrow();
  });

  it("rejects a localhost production app base URL when explicitly provided", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        APPWRITE_PROJECT_ID: "toastmasters-hub",
        APPWRITE_API_KEY: "secret-api-key",
        VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
        SMTP_PORT: "587",
        SMTP_USER: "club@example.com",
        SMTP_PASS: "app-password",
        SMTP_FROM: "club@example.com",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow(/public url/i);
  });

  it("accepts public production URLs", () => {
    const result = parseEnv({
      NODE_ENV: "production",
      APPWRITE_PROJECT_ID: "toastmasters-hub",
      APPWRITE_API_KEY: "secret-api-key",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      SMTP_PORT: "587",
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      APP_BASE_URL: "https://toastmastershub.netlify.app",
    });

    expect(result.APP_BASE_URL).toBe("https://toastmastershub.netlify.app");
  });
});
