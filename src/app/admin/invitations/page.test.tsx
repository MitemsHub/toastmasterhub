import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvitationsPage from "./page";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { getEnv } from "@/lib/config";
import { listInvitationStatusItems } from "@/lib/invitations/service";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "session" }),
  }),
}));

vi.mock("@/lib/next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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

vi.mock("@/lib/appwrite/client", () => ({
  getAppwriteAdmin: vi.fn(),
}));

vi.mock("@/lib/vpe/service", () => ({
  getAuthenticatedVpe: vi.fn(),
}));

describe("InvitationsPage", () => {
  beforeEach(() => {
    vi.mocked(listInvitationStatusItems).mockReset();
    vi.mocked(getEnv).mockReset();
    vi.mocked(getAppwriteAdmin).mockReset();
    vi.mocked(getAuthenticatedVpe).mockReset();
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

  it("loads invitation statuses from storage", async () => {
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(listInvitationStatusItems).mockResolvedValue([
      {
        id: "inv_1",
        evaluatorName: "Amina Bello",
        evaluatorEmail: "amina@example.com",
        evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
        evaluatorPhotoUrl: "https://example.com/amina.jpg",
        requestedByName: "Amina Bello",
        requestedByEmail: "amina@example.com",
        ownedByCurrentVpe: true,
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
    expect(vi.mocked(listInvitationStatusItems)).toHaveBeenCalledWith(
      expect.anything(),
      {
        currentVpeId: "vpe_1",
        includeAllVpes: true,
      },
    );
  });

  it("lets the admin layout handle backend outages", async () => {
    vi.mocked(getAppwriteAdmin).mockRejectedValue(new Error("connect ECONNREFUSED appwrite"));

    await expect(
      InvitationsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(/ECONNREFUSED/i);
  });
});
