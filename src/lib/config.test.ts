import { describe, expect, it } from "vitest";
import { parseEnv } from "./config";

describe("parseEnv", () => {
  it("accepts a valid Appwrite and SMTP configuration", () => {
    const result = parseEnv({
      NODE_ENV: "development",
      APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
      APPWRITE_PROJECT_ID: "toastmasters-hub",
      APPWRITE_API_KEY: "secret-api-key",
      APPWRITE_DATABASE_ID: "main",
      APPWRITE_VPES_COLLECTION_ID: "vpes",
      APPWRITE_EVALUATORS_COLLECTION_ID: "evaluators",
      APPWRITE_INVITATIONS_COLLECTION_ID: "invitations",
      APPWRITE_STORAGE_BUCKET_ID: "evaluator-photos",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      APP_BASE_URL: "http://localhost:3000",
    });

    expect(result.APPWRITE_ENDPOINT).toBe("https://cloud.appwrite.io/v1");
    expect(result.SMTP_PORT).toBe(587);
  });

  it("rejects invalid email configuration", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "development",
        APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
        APPWRITE_PROJECT_ID: "toastmasters-hub",
        APPWRITE_API_KEY: "secret-api-key",
        APPWRITE_DATABASE_ID: "main",
        APPWRITE_VPES_COLLECTION_ID: "vpes",
        APPWRITE_EVALUATORS_COLLECTION_ID: "evaluators",
        APPWRITE_INVITATIONS_COLLECTION_ID: "invitations",
        APPWRITE_STORAGE_BUCKET_ID: "evaluator-photos",
        VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_USER: "club@example.com",
        SMTP_PASS: "app-password",
        SMTP_FROM: "not-an-email",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow();
  });

  it("rejects local production URLs", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        APPWRITE_ENDPOINT: "http://127.0.0.1:8090/v1",
        APPWRITE_PROJECT_ID: "toastmasters-hub",
        APPWRITE_API_KEY: "secret-api-key",
        APPWRITE_DATABASE_ID: "main",
        APPWRITE_VPES_COLLECTION_ID: "vpes",
        APPWRITE_EVALUATORS_COLLECTION_ID: "evaluators",
        APPWRITE_INVITATIONS_COLLECTION_ID: "invitations",
        APPWRITE_STORAGE_BUCKET_ID: "evaluator-photos",
        VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
        SMTP_HOST: "smtp.gmail.com",
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
      APPWRITE_ENDPOINT: "https://fra.cloud.appwrite.io/v1",
      APPWRITE_PROJECT_ID: "toastmasters-hub",
      APPWRITE_API_KEY: "secret-api-key",
      APPWRITE_DATABASE_ID: "main",
      APPWRITE_VPES_COLLECTION_ID: "vpes",
      APPWRITE_EVALUATORS_COLLECTION_ID: "evaluators",
      APPWRITE_INVITATIONS_COLLECTION_ID: "invitations",
      APPWRITE_STORAGE_BUCKET_ID: "evaluator-photos",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      APP_BASE_URL: "https://toastmastershub.netlify.app",
    });

    expect(result.APPWRITE_ENDPOINT).toBe("https://fra.cloud.appwrite.io/v1");
  });
});
