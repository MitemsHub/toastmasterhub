import { describe, expect, it, vi } from "vitest";
import {
  getInvitationConfirmationDetails,
  respondToInvitation,
} from "./response";

describe("getInvitationConfirmationDetails", () => {
  it("maps the invitation and evaluator details for the public confirmation page", async () => {
    const filter = vi.fn().mockReturnValue("token-filter");
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
      meeting_title: "Toastmasters Club Meeting",
      meeting_date: "2026-08-15",
      meeting_note: "Please arrive 15 minutes early.",
      status: "pending",
      expand: {
        evaluator: {
          id: "eva_1",
          full_name: "Amina Bello",
          profile: "Warm evaluator who gives direct and practical feedback.",
          photo: "amina.jpg",
        },
      },
    });

    const result = await getInvitationConfirmationDetails(
      {
        collection: () => ({
          getFirstListItem,
        }),
        filter,
        files: {
          getURL: () => "https://example.com/amina.jpg",
        },
      },
      "plain-token",
    );

    expect(filter).toHaveBeenCalledWith("token_hash = {:tokenHash}", {
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(getFirstListItem).toHaveBeenCalledWith("token-filter", {
      expand: "evaluator",
    });
    expect(result).toEqual({
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
  });

  it("returns null when the token does not match an invitation", async () => {
    const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });

    await expect(
      getInvitationConfirmationDetails(
        {
          collection: () => ({
            getFirstListItem,
          }),
          filter: vi.fn().mockReturnValue("token-filter"),
          files: {
            getURL: vi.fn(),
          },
        },
        "plain-token",
      ),
    ).resolves.toBeNull();
  });
});

describe("respondToInvitation", () => {
  it("updates a pending invitation with the selected response", async () => {
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
      status: "pending",
    });
    const update = vi.fn().mockResolvedValue(undefined);

    await respondToInvitation(
      {
        collection: () => ({
          getFirstListItem,
          update,
        }),
        filter: vi.fn().mockReturnValue("token-filter"),
      },
      {
        token: "plain-token",
        response: "accepted",
      },
      () => "2026-08-15T10:30:00.000Z",
    );

    expect(update).toHaveBeenCalledWith("inv_1", {
      status: "accepted",
      responded_at: "2026-08-15T10:30:00.000Z",
    });
  });

  it("rejects a second response after the invitation is no longer pending", async () => {
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
      status: "accepted",
    });

    await expect(
      respondToInvitation(
        {
          collection: () => ({
            getFirstListItem,
            update: vi.fn(),
          }),
          filter: vi.fn().mockReturnValue("token-filter"),
        },
        {
          token: "plain-token",
          response: "declined",
        },
      ),
    ).rejects.toThrow("This invitation has already been responded to.");
  });
});
