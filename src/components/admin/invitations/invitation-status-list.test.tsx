import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvitationStatusList } from "./invitation-status-list";

vi.mock("@/lib/next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("InvitationStatusList", () => {
  it("shows an empty state when there are no invitations", () => {
    render(<InvitationStatusList activeFilter="all" invitations={[]} />);

    expect(screen.getByText(/no invitations match this view yet/i)).toBeInTheDocument();
  });

  it("renders pending and responded invitation records", () => {
    render(
      <InvitationStatusList
        activeFilter="all"
        invitations={[
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
            meetingTitle: "Club Meeting",
            meetingDate: "2026-08-29",
            meetingNote: "",
            status: "accepted",
            sentAt: "2026-08-14T09:00:00.000Z",
            respondedAt: "2026-08-14T18:30:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /review and manage responses/i })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Michael Grant")).toBeInTheDocument();
    expect(screen.getByText(/requested by chuks mitti/i)).toBeInTheDocument();
    expect(screen.getByText(/requested by garba/i)).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
    expect(screen.getByText(/sent 2026-08-01/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting reply/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /reschedule/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /cancel/i })).toHaveLength(2);
    expect(screen.getByText(/showing 2 of 2/i)).toBeInTheDocument();
  });

  it("filters the confirmation board with the search field", () => {
    render(
      <InvitationStatusList
        activeFilter="all"
        invitations={[
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
        ]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/search evaluator, requester, meeting, date, or status/i), {
      target: { value: "apex" },
    });

    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Michael Grant")).toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument();
  });

  it("shows a no-results message when the search does not match", () => {
    render(
      <InvitationStatusList
        activeFilter="all"
        invitations={[
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
        ]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/search evaluator, requester, meeting, date, or status/i), {
      target: { value: "missing record" },
    });

    expect(screen.getByText(/no invitations match your search/i)).toBeInTheDocument();
  });
});
