import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvitationsPage from "./page";
import { getEnv } from "@/lib/config";
import { listInvitationStatusItems } from "@/lib/invitations/service";
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

vi.mock("@/lib/invitations/service", () => ({
  listInvitationStatusItems: vi.fn(),
  summarizeInvitationStatuses: vi.fn((items) => ({
    pending: items.filter((item: { status: string }) => item.status === "pending").length,
    confirmed: items.filter((item: { status: string }) => item.status === "accepted").length,
    declined: items.filter((item: { status: string }) => item.status === "declined").length,
  })),
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

describe("InvitationsPage", () => {
  beforeEach(() => {
    vi.mocked(listInvitationStatusItems).mockReset();
    vi.mocked(getEnv).mockReset();
    vi.mocked(getPocketBaseAdmin).mockReset();
    vi.mocked(getAuthenticatedVpe).mockReset();
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

  it("loads invitation statuses from storage", async () => {
    vi.mocked(getPocketBaseAdmin).mockResolvedValue({} as never);
    vi.mocked(listInvitationStatusItems).mockResolvedValue([
      {
        id: "inv_1",
        evaluatorName: "Amina Bello",
        evaluatorEmail: "amina@example.com",
        evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
        evaluatorPhotoUrl: "https://example.com/amina.jpg",
        meetingTitle: "Toastmasters Club Meeting",
        meetingDate: "2026-08-15",
        meetingNote: "Please arrive early.",
        status: "pending",
        sentAt: "2026-08-01T09:00:00.000Z",
      },
    ]);

    render(await InvitationsPage({ searchParams: Promise.resolve({ updated: "1" }) }));

    expect(screen.getByRole("heading", { name: /review and manage responses/i })).toBeInTheDocument();
    expect(screen.getByText("Amina Bello")).toBeInTheDocument();
    expect(screen.getByText("Toastmasters Club Meeting")).toBeInTheDocument();
    expect(screen.getByText(/fresh confirmation link has been sent/i)).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
  });

  it("lets the admin layout handle backend outages", async () => {
    vi.mocked(getPocketBaseAdmin).mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8090"));

    await expect(
      InvitationsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/ECONNREFUSED/i);
  });
});
