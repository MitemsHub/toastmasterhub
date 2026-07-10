import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { listInvitationStatusItems } from "@/lib/invitations/service";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "session" }),
  }),
}));

vi.mock("@/lib/appwrite/client", () => ({
  getAppwriteAdmin: vi.fn(),
}));

vi.mock("@/lib/vpe/service", () => ({
  getAuthenticatedVpe: vi.fn(),
}));

vi.mock("@/lib/invitations/service", () => ({
  listInvitationStatusItems: vi.fn(),
  summarizeInvitationStatuses: vi.fn((items) => ({
    pending: items.filter((item: { status: string }) => item.status === "pending").length,
    confirmed: items.filter((item: { status: string }) => item.status === "accepted").length,
    declined: items.filter((item: { status: string }) => item.status === "declined").length,
  })),
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.mocked(getAppwriteAdmin).mockReset();
    vi.mocked(getAuthenticatedVpe).mockReset();
    vi.mocked(listInvitationStatusItems).mockReset();
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(getAuthenticatedVpe).mockResolvedValue({
      id: "vpe_1",
      name: "Chuks Mitti",
      email: "emmanuelmitti1998@gmail.com",
      accessCodeHash: "hash",
    });
  });

  it("shows the shared invitation summary on the dashboard", async () => {
    vi.mocked(listInvitationStatusItems).mockResolvedValue([
      {
        id: "inv_1",
        evaluatorName: "Jane Doe",
        evaluatorEmail: "jane@example.com",
        evaluatorProfile: "Experienced evaluator and speaker.",
        evaluatorPhotoUrl: "https://example.com/jane.jpg",
        requestedByName: "Chuks Mitti",
        requestedByEmail: "emmanuelmitti1998@gmail.com",
        ownedByCurrentVpe: true,
        meetingTitle: "Club Meeting",
        meetingDate: "2026-08-15",
        meetingNote: "Please arrive early.",
        status: "pending",
        sentAt: "2026-08-01T09:00:00.000Z",
      },
      {
        id: "inv_2",
        evaluatorName: "Michael Grant",
        evaluatorEmail: "michael@example.com",
        evaluatorProfile: "Thoughtful evaluator with strong written notes.",
        evaluatorPhotoUrl: "https://example.com/michael.jpg",
        requestedByName: "Garba",
        requestedByEmail: "umargm99@yahoo.com",
        ownedByCurrentVpe: false,
        meetingTitle: "Apex Toastmasters",
        meetingDate: "2026-08-29",
        meetingNote: "",
        status: "accepted",
        sentAt: "2026-08-14T09:00:00.000Z",
        respondedAt: "2026-08-14T18:30:00.000Z",
      },
    ]);

    render(await AdminPage());

    expect(screen.getAllByText("1", { selector: "p" })).toHaveLength(2);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getAllByText("0", { selector: "p" })).toHaveLength(1);
    expect(screen.getByText(/shared confirmation board/i)).toBeInTheDocument();
    expect(vi.mocked(listInvitationStatusItems)).toHaveBeenCalledWith(
      expect.anything(),
      {
        currentVpeId: "vpe_1",
        includeAllVpes: true,
      },
    );
  });

  it("returns null when there is no authenticated VPE", async () => {
    vi.mocked(getAuthenticatedVpe).mockResolvedValue(null);

    await expect(AdminPage()).resolves.toBeNull();
  });
});
