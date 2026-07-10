import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EvaluatorsPage from "./page";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { getEnv } from "@/lib/config";
import { listEvaluatorDirectoryItems } from "@/lib/evaluators/service";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "session" }),
  }),
}));

vi.mock("@/lib/next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/evaluators/service", () => ({
  listEvaluatorDirectoryItems: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  getEnv: vi.fn(),
}));

vi.mock("@/lib/appwrite/client", () => ({
  getAppwriteAdmin: vi.fn(),
}));

vi.mock("@/lib/vpe/service", () => ({
  getAuthenticatedVpe: vi.fn(),
}));

describe("EvaluatorsPage", () => {
  beforeEach(() => {
    vi.mocked(listEvaluatorDirectoryItems).mockReset();
    vi.mocked(getAuthenticatedVpe).mockReset();
    vi.mocked(getEnv).mockReset();
    vi.mocked(getAppwriteAdmin).mockReset();
    vi.mocked(getEnv).mockReturnValue({
      APPWRITE_PROJECT_ID: "toastmasters-hub",
      APPWRITE_API_KEY: "secret-api-key",
      SMTP_PORT: 587,
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      VPE_SIGNUP_OTC: "TMH-ABUJA-2026",
      APP_BASE_URL: "https://toastmastershub.example.com",
    });
    vi.mocked(getAuthenticatedVpe).mockResolvedValue({
      id: "vpe_1",
      name: "Amina Bello",
      email: "amina@example.com",
      accessCodeHash: "hash",
    });
  });

  it("loads VPE-scoped evaluators and shows a success message after sending", async () => {
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(listEvaluatorDirectoryItems).mockResolvedValue([
      {
        id: "eva_1",
        name: "Amina Bello",
        email: "amina@example.com",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photoUrl: "https://example.com/amina.jpg",
        createdAt: "2026-08-01T10:00:00.000Z",
      },
    ]);

    render(
      await EvaluatorsPage({
        searchParams: Promise.resolve({ sent: "1" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: /create the request and send it once/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Amina Bello")).toBeInTheDocument();
    expect(screen.getByText(/confirmation sent\./i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amina Bello" }).getAttribute("src")).toContain(
      encodeURIComponent("https://example.com/amina.jpg"),
    );
  });

  it("lets the admin layout handle backend outages", async () => {
    vi.mocked(getAppwriteAdmin).mockRejectedValue(new Error("connect ECONNREFUSED appwrite"));

    await expect(
      EvaluatorsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/ECONNREFUSED/i);
  });
});
