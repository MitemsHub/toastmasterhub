import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvitationResponseCard } from "./invitation-response-card";

describe("InvitationResponseCard", () => {
  it("shows the evaluator identity and response buttons for a pending invitation", () => {
    render(
      <InvitationResponseCard
        invitation={{
          invitationId: "inv_1",
          evaluatorName: "Amina Bello",
          evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
          evaluatorPhotoUrl: "https://example.com/amina.jpg",
          meetingTitle: "Toastmasters Club Meeting",
          meetingDate: "2026-08-15",
          meetingNote: "Please arrive 15 minutes early.",
          status: "pending",
          canRespond: true,
        }}
        token="plain-token"
      />,
    );

    expect(screen.getByText(/evaluator confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amina Bello" }).getAttribute("src")).toContain(
      encodeURIComponent("https://example.com/amina.jpg"),
    );
    expect(screen.getByText("Warm evaluator who gives direct and practical feedback.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes, i will/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /no, i won't/i })).toBeInTheDocument();
  });

  it("shows a locked state after the invitation has been answered", () => {
    render(
      <InvitationResponseCard
        invitation={{
          invitationId: "inv_1",
          evaluatorName: "Amina Bello",
          evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
          evaluatorPhotoUrl: "https://example.com/amina.jpg",
          meetingTitle: "Toastmasters Club Meeting",
          meetingDate: "2026-08-15",
          meetingNote: "",
          status: "accepted",
          canRespond: false,
        }}
        token="plain-token"
      />,
    );

    expect(screen.getByText(/this meeting request has already been answered/i)).toBeInTheDocument();
    expect(screen.getByText(/your availability is confirmed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /yes, i will/i })).not.toBeInTheDocument();
  });

  it("falls back to an initial when the evaluator portrait is missing", () => {
    render(
      <InvitationResponseCard
        invitation={{
          invitationId: "inv_1",
          evaluatorName: "Amina Bello",
          evaluatorProfile: "Warm evaluator who gives direct and practical feedback.",
          evaluatorPhotoUrl: "",
          meetingTitle: "Toastmasters Club Meeting",
          meetingDate: "2026-08-15",
          meetingNote: "",
          status: "pending",
          canRespond: true,
        }}
        token="plain-token"
      />,
    );

    expect(screen.queryByRole("img", { name: "Amina Bello" })).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
