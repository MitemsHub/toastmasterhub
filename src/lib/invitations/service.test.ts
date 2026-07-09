import { describe, expect, it, vi } from "vitest";
import { listInvitationStatusItems, summarizeInvitationStatuses } from "./service";

describe("listInvitationStatusItems", () => {
  it("maps PocketBase invitations into VPE-scoped status list items", async () => {
    const getFullList = vi.fn().mockResolvedValue([
      {
        id: "inv_1",
        meeting_title: "Toastmasters Club Meeting",
        meeting_date: "2026-08-15",
        meeting_note: "Please arrive early.",
        status: "pending",
        sent_at: "2026-08-01T09:00:00.000Z",
        responded_at: "2026-08-02T10:30:00.000Z",
        expand: {
          evaluator: {
            full_name: "Amina Bello",
            email: "amina@example.com",
            profile: "Warm evaluator who gives direct and practical feedback.",
            photo: "amina.jpg",
          },
        },
      },
    ]);

    const result = await listInvitationStatusItems(
      {
        collection: () => ({
          getFullList,
        }),
        filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
        files: {
          getURL: () => "https://example.com/amina.jpg",
        },
      } as never,
      "vpe_1",
    );

    expect(getFullList).toHaveBeenCalledWith({
      expand: "evaluator",
      filter: "vpe = 'vpe_1'",
      sort: "-created",
    });
    expect(result).toEqual([
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
        respondedAt: "2026-08-02T10:30:00.000Z",
      },
    ]);
  });

  it("retries without created sorting when PocketBase rejects that field", async () => {
    const getFullList = vi
      .fn()
      .mockRejectedValueOnce({ status: 400 })
      .mockResolvedValueOnce([
        {
          id: "inv_1",
          meeting_title: "Toastmasters Club Meeting",
          meeting_date: "2026-08-15",
          meeting_note: "Please arrive early.",
          status: "pending",
          sent_at: "2026-08-01T09:00:00.000Z",
          responded_at: "2026-08-02T10:30:00.000Z",
          expand: {
            evaluator: {
              full_name: "Amina Bello",
              email: "amina@example.com",
              profile: "Warm evaluator who gives direct and practical feedback.",
              photo: "amina.jpg",
            },
          },
        },
      ]);

    const result = await listInvitationStatusItems(
      {
        collection: () => ({
          getFullList,
        }),
        filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
        files: {
          getURL: () => "https://example.com/amina.jpg",
        },
      } as never,
      "vpe_1",
    );

    expect(getFullList).toHaveBeenNthCalledWith(1, {
      expand: "evaluator",
      filter: "vpe = 'vpe_1'",
      sort: "-created",
    });
    expect(getFullList).toHaveBeenNthCalledWith(2, {
      expand: "evaluator",
      filter: "vpe = 'vpe_1'",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("pending");
  });

  it("returns an empty list when PocketBase responds with a recoverable list error", async () => {
    const getFullList = vi.fn().mockRejectedValue({ status: 400 });

    const result = await listInvitationStatusItems(
      {
        collection: () => ({
          getFullList,
        }),
        filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
        files: {
          getURL: () => "https://example.com/amina.jpg",
        },
      } as never,
      "vpe_1",
    );

    expect(result).toEqual([]);
  });
});

describe("summarizeInvitationStatuses", () => {
  it("summarizes pending, confirmed, and declined counts", () => {
    expect(
      summarizeInvitationStatuses([
        { id: "1", evaluatorName: "", evaluatorEmail: "", evaluatorProfile: "", evaluatorPhotoUrl: "", meetingTitle: "", meetingDate: "", meetingNote: "", status: "pending" },
        { id: "2", evaluatorName: "", evaluatorEmail: "", evaluatorProfile: "", evaluatorPhotoUrl: "", meetingTitle: "", meetingDate: "", meetingNote: "", status: "accepted" },
        { id: "3", evaluatorName: "", evaluatorEmail: "", evaluatorProfile: "", evaluatorPhotoUrl: "", meetingTitle: "", meetingDate: "", meetingNote: "", status: "declined" },
      ]),
    ).toEqual({
      pending: 1,
      confirmed: 1,
      declined: 1,
    });
  });
});
