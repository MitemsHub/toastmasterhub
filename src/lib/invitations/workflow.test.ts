import { describe, expect, it, vi } from "vitest";
import {
  createConfirmationRequest,
  EvaluatorDateConflictError,
  rescheduleInvitation,
} from "./workflow";

describe("createConfirmationRequest", () => {
  it("uses the selected shared evaluator, emails them, and stamps sent_at", async () => {
    const getEvaluator = vi.fn().mockResolvedValue({
      id: "eva_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
    });
    const updateEvaluator = vi.fn().mockResolvedValue(undefined);
    const getInvitations = vi.fn().mockResolvedValue([]);
    const createInvitation = vi.fn().mockResolvedValue({ id: "inv_1" });
    const updateInvitation = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const formData = new FormData();
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    formData.set("evaluatorId", "eva_1");
    formData.set("photo", photo);
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");
    formData.set("meetingNote", "Please arrive 15 minutes early.");

    await createConfirmationRequest(
      {
        collection: (name: string) =>
          name === "evaluators"
            ? {
                getOne: getEvaluator,
                update: updateEvaluator,
              }
            : {
                getFullList: getInvitations,
                create: createInvitation,
                update: updateInvitation,
              },
        filter: vi.fn().mockReturnValue("filter"),
      } as never,
      {
        sendMail,
      },
      {
        fromAddress: "club@example.com",
        appBaseUrl: "https://toastmasters.example",
      },
      {
        vpeId: "vpe_1",
        vpeName: "Chiamaka Obi",
      },
      formData,
      () => "2026-08-01T09:00:00.000Z",
    );

    expect(getEvaluator).toHaveBeenCalledWith("eva_1");
    expect(updateEvaluator).toHaveBeenCalledWith("eva_1", {
      photo,
    });
    expect(createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        vpe: "vpe_1",
        evaluator: "eva_1",
        meeting_title: "Toastmasters Club Meeting",
        status: "pending",
        token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "amina@example.com",
        html: expect.stringContaining("/confirm/"),
      }),
    );
    expect(updateInvitation).toHaveBeenCalledWith("inv_1", {
      sent_at: "2026-08-01T09:00:00.000Z",
    });
  });

  it("blocks a request when the evaluator is already booked on that date", async () => {
    const formData = new FormData();
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    formData.set("evaluatorId", "eva_1");
    formData.set("photo", photo);
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");

    await expect(
      createConfirmationRequest(
        {
          collection: (name: string) =>
            name === "evaluators"
              ? {
                  getOne: vi.fn().mockResolvedValue({
                    id: "eva_1",
                    full_name: "Amina Bello",
                    email: "amina@example.com",
                  }),
                  update: vi.fn(),
                }
              : {
                  getFullList: vi.fn().mockResolvedValue([
                    {
                      id: "inv_existing",
                      status: "pending",
                      vpe: "vpe_2",
                    },
                  ]),
                  create: vi.fn(),
                  update: vi.fn(),
                },
          filter: vi.fn().mockReturnValue("filter"),
        } as never,
        {
          sendMail: vi.fn(),
        },
        {
          fromAddress: "club@example.com",
          appBaseUrl: "https://toastmasters.example",
        },
        {
          vpeId: "vpe_1",
          vpeName: "Chiamaka Obi",
        },
        formData,
      ),
    ).rejects.toBeInstanceOf(EvaluatorDateConflictError);
  });

  it("deletes the created invitation when email delivery fails", async () => {
    const updateEvaluator = vi.fn().mockResolvedValue(undefined);
    const createInvitation = vi.fn().mockResolvedValue({ id: "inv_1" });
    const deleteInvitation = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockRejectedValue(new Error("SMTP down"));
    const formData = new FormData();
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    formData.set("evaluatorId", "eva_1");
    formData.set("photo", photo);
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");

    await expect(
      createConfirmationRequest(
        {
          collection: (name: string) =>
            name === "evaluators"
              ? {
                  getOne: vi.fn().mockResolvedValue({
                    id: "eva_1",
                    full_name: "Amina Bello",
                    email: "amina@example.com",
                  }),
                  update: updateEvaluator,
                }
              : {
                  getFullList: vi.fn().mockResolvedValue([]),
                  create: createInvitation,
                  update: vi.fn(),
                  delete: deleteInvitation,
                },
          filter: vi.fn().mockReturnValue("filter"),
        } as never,
        {
          sendMail,
        },
        {
          fromAddress: "club@example.com",
          appBaseUrl: "https://toastmasters.example",
        },
        {
          vpeId: "vpe_1",
          vpeName: "Chiamaka Obi",
        },
        formData,
      ),
    ).rejects.toThrow(/smtp down/i);

    expect(deleteInvitation).toHaveBeenCalledWith("inv_1");
  });

  it("uses the existing evaluator portrait when no replacement image is uploaded", async () => {
    const getEvaluator = vi.fn().mockResolvedValue({
      id: "eva_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
    });
    const getInvitations = vi.fn().mockResolvedValue([]);
    const createInvitation = vi.fn().mockResolvedValue({ id: "inv_1" });
    const updateInvitation = vi.fn().mockResolvedValue(undefined);
    const updateEvaluator = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const formData = new FormData();

    formData.set("evaluatorId", "eva_1");
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");

    await createConfirmationRequest(
      {
        collection: (name: string) =>
          name === "evaluators"
            ? {
                getOne: getEvaluator,
                update: updateEvaluator,
              }
            : {
                getFullList: getInvitations,
                create: createInvitation,
                update: updateInvitation,
              },
        filter: vi.fn().mockReturnValue("filter"),
      } as never,
      {
        sendMail,
      },
      {
        fromAddress: "club@example.com",
        appBaseUrl: "https://toastmasters.example",
      },
      {
        vpeId: "vpe_1",
        vpeName: "Chiamaka Obi",
      },
      formData,
    );

    expect(updateEvaluator).not.toHaveBeenCalled();
    expect(createInvitation).toHaveBeenCalled();
  });
});

describe("rescheduleInvitation", () => {
  it("blocks a reschedule when the same evaluator is already booked on that new date", async () => {
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
      evaluator: "eva_1",
      meeting_title: "Old Meeting",
      meeting_date: "2026-08-01",
      meeting_note: "Old note",
      sent_at: "2026-07-20T10:00:00.000Z",
      responded_at: "2026-07-25T10:00:00.000Z",
      status: "accepted",
      token_hash: "old-hash",
      expand: {
        evaluator: {
          full_name: "Amina Bello",
          email: "amina@example.com",
        },
      },
    });
    const getFullList = vi.fn().mockResolvedValue([
      {
        id: "inv_2",
        status: "pending",
        vpe: "vpe_2",
      },
    ]);
    const formData = new FormData();

    formData.set("invitationId", "inv_1");
    formData.set("meetingTitle", "New Meeting");
    formData.set("meetingDate", "2026-09-01");
    formData.set("meetingNote", "New note");

    await expect(
      rescheduleInvitation(
        {
          collection: () => ({
            getFirstListItem,
            getFullList,
            update: vi.fn(),
          }),
          filter: vi.fn().mockReturnValue("invitation-filter"),
        } as never,
        {
          sendMail: vi.fn(),
        },
        {
          fromAddress: "club@example.com",
          appBaseUrl: "https://toastmasters.example",
        },
        {
          vpeId: "vpe_1",
          vpeName: "Chiamaka Obi",
        },
        formData,
      ),
    ).rejects.toBeInstanceOf(EvaluatorDateConflictError);
  });

  it("restores the previous invitation state when the resend email fails", async () => {
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
      evaluator: "eva_1",
      meeting_title: "Old Meeting",
      meeting_date: "2026-08-01",
      meeting_note: "Old note",
      sent_at: "2026-07-20T10:00:00.000Z",
      responded_at: "2026-07-25T10:00:00.000Z",
      status: "accepted",
      token_hash: "old-hash",
      expand: {
        evaluator: {
          full_name: "Amina Bello",
          email: "amina@example.com",
        },
      },
    });
    const getFullList = vi.fn().mockResolvedValue([]);
    const updateInvitation = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockRejectedValue(new Error("SMTP down"));
    const formData = new FormData();

    formData.set("invitationId", "inv_1");
    formData.set("meetingTitle", "New Meeting");
    formData.set("meetingDate", "2026-09-01");
    formData.set("meetingNote", "New note");

    await expect(
      rescheduleInvitation(
        {
          collection: () => ({
            getFirstListItem,
            getFullList,
            update: updateInvitation,
          }),
          filter: vi.fn().mockReturnValue("invitation-filter"),
        } as never,
        {
          sendMail,
        },
        {
          fromAddress: "club@example.com",
          appBaseUrl: "https://toastmasters.example",
        },
        {
          vpeId: "vpe_1",
          vpeName: "Chiamaka Obi",
        },
        formData,
      ),
    ).rejects.toThrow(/smtp down/i);

    expect(updateInvitation).toHaveBeenNthCalledWith(
      1,
      "inv_1",
      expect.objectContaining({
        meeting_title: "New Meeting",
        meeting_date: "2026-09-01",
        status: "pending",
      }),
    );
    expect(updateInvitation).toHaveBeenNthCalledWith(2, "inv_1", {
      meeting_title: "Old Meeting",
      meeting_date: "2026-08-01",
      meeting_note: "Old note",
      responded_at: "2026-07-25T10:00:00.000Z",
      sent_at: "2026-07-20T10:00:00.000Z",
      status: "accepted",
      token_hash: "old-hash",
    });
  });
});
