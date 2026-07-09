import { describe, expect, it, vi } from "vitest";
import { createConfirmationRequest } from "./workflow";

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
});
