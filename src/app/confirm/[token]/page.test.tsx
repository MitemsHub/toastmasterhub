import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmationPage from "./page";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { getInvitationConfirmationDetails } from "@/lib/invitations/response";

vi.mock("@/lib/next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/invitations/response", () => ({
  getInvitationConfirmationDetails: vi.fn(),
}));

vi.mock("@/lib/appwrite/client", () => ({
  getAppwriteAdmin: vi.fn(),
}));

describe("ConfirmationPage", () => {
  beforeEach(() => {
    vi.mocked(getInvitationConfirmationDetails).mockReset();
    vi.mocked(getAppwriteAdmin).mockReset();
  });

  it("loads the public invitation details for a valid token", async () => {
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(getInvitationConfirmationDetails).mockResolvedValue({
      invitationId: "inv_1",
      evaluatorName: "Amina Bello",
      evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
      evaluatorPhotoUrl: "https://example.com/amina.jpg",
      meetingTitle: "Toastmasters Club Meeting",
      meetingDate: "2026-08-15",
      meetingNote: "Please arrive 15 minutes early.",
      status: "pending",
      canRespond: true,
    });

    render(
      await ConfirmationPage({
        params: Promise.resolve({ token: "plain-token" }),
      }),
    );

    expect(screen.getByText(/evaluator confirmation/i)).toBeInTheDocument();
    expect(screen.getByText("Amina Bello")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes, i will/i })).toBeInTheDocument();
  });
});
