import { describe, expect, it, vi } from "vitest";
import { createConfirmationRequest, rescheduleInvitation } from "./workflow";

describe("createConfirmationRequest", () => {
  it("creates the evaluator, emails the evaluator, and stamps sent_at", async () => {
    const createEvaluator = vi.fn().mockResolvedValue({
      id: "eva_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
    });
    const createInvitation = vi.fn().mockResolvedValue({ id: "inv_1" });
    const updateInvitation = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const formData = new FormData();
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");
    formData.set("photo", photo);
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");
    formData.set("meetingNote", "Please arrive 15 minutes early.");

    await createConfirmationRequest(
      {
        collection: (name: string) =>
          name === "evaluators"
            ? {
                create: createEvaluator,
              }
            : {
                create: createInvitation,
                update: updateInvitation,
              },
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

    expect(createEvaluator).toHaveBeenCalledWith(
      expect.objectContaining({
        vpe: "vpe_1",
        full_name: "Amina Bello",
      }),
    );
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

  it("deletes the created invitation when email delivery fails", async () => {
    const createEvaluator = vi.fn().mockResolvedValue({
      id: "eva_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
    });
    const createInvitation = vi.fn().mockResolvedValue({ id: "inv_1" });
    const deleteInvitation = vi.fn().mockResolvedValue(undefined);
    const sendMail = vi.fn().mockRejectedValue(new Error("SMTP down"));
    const formData = new FormData();
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");
    formData.set("photo", photo);
    formData.set("meetingTitle", "Toastmasters Club Meeting");
    formData.set("meetingDate", "2026-08-15");

    await expect(
      createConfirmationRequest(
        {
          collection: (name: string) =>
            name === "evaluators"
              ? {
                  create: createEvaluator,
                }
              : {
                  create: createInvitation,
                  update: vi.fn(),
                  delete: deleteInvitation,
                },
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
});

describe("rescheduleInvitation", () => {
  it("restores the previous invitation state when the resend email fails", async () => {
    const getFirstListItem = vi.fn().mockResolvedValue({
      id: "inv_1",
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
