import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EvaluatorsPage from "./page";
import { getEnv } from "@/lib/config";
import { listEvaluatorDirectoryItems } from "@/lib/evaluators/service";
import { getPocketBaseAdmin } from "@/lib/pocketbase/client";
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

vi.mock("@/lib/pocketbase/client", () => ({
  getPocketBaseAdmin: vi.fn(),
}));

vi.mock("@/lib/vpe/service", () => ({
  getAuthenticatedVpe: vi.fn(),
}));

describe("EvaluatorsPage", () => {
  beforeEach(() => {
    vi.mocked(listEvaluatorDirectoryItems).mockReset();
    vi.mocked(getAuthenticatedVpe).mockReset();
    vi.mocked(getEnv).mockReset();
    vi.mocked(getPocketBaseAdmin).mockReset();
    vi.mocked(getEnv).mockReturnValue({
      POCKETBASE_URL: "http://127.0.0.1:8090",
      POCKETBASE_ADMIN_EMAIL: "admin@example.com",
      POCKETBASE_ADMIN_PASSWORD: "super-secret-password",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: 587,
      SMTP_USER: "club@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "club@example.com",
      APP_BASE_URL: "http://localhost:3000",
    });
    vi.mocked(getAuthenticatedVpe).mockResolvedValue({
      id: "vpe_1",
      name: "Amina Bello",
      email: "amina@example.com",
      accessCodeHash: "hash",
    });
  });

  it("loads VPE-scoped evaluators and shows a success message after sending", async () => {
    vi.mocked(getPocketBaseAdmin).mockResolvedValue({} as never);
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
    vi.mocked(getPocketBaseAdmin).mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8090"));

    await expect(
      EvaluatorsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/ECONNREFUSED/i);
  });
});
