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

  it("shows the thank-you state after a saved acceptance even if the invitation refetch fails", async () => {
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(getInvitationConfirmationDetails).mockResolvedValue(null);

    render(
      await ConfirmationPage({
        params: Promise.resolve({ token: "plain-token" }),
        searchParams: Promise.resolve({ saved: "1", response: "accepted" }),
      }),
    );

    expect(screen.getByText(/thank you\./i)).toBeInTheDocument();
    expect(screen.getByText(/your availability has been saved successfully/i)).toBeInTheDocument();
  });

  it("shows the reschedule state after a saved decline even if the invitation refetch fails", async () => {
    vi.mocked(getAppwriteAdmin).mockResolvedValue({} as never);
    vi.mocked(getInvitationConfirmationDetails).mockResolvedValue(null);

    render(
      await ConfirmationPage({
        params: Promise.resolve({ token: "plain-token" }),
        searchParams: Promise.resolve({ saved: "1", response: "declined" }),
      }),
    );

    expect(screen.getByText(/sorry, we will reschedule\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/your response has been saved and the vpe can send a new date if needed/i),
    ).toBeInTheDocument();
  });
});
