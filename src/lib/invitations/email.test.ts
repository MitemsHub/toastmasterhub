import { describe, expect, it, vi } from "vitest";
import { buildInvitationConfirmationUrl, sendInvitationEmail } from "./email";

describe("buildInvitationConfirmationUrl", () => {
  it("builds a public confirmation link from the app base url and token", () => {
    expect(
      buildInvitationConfirmationUrl("plain-token", "https://toastmasters.example/"),
    ).toBe("https://toastmasters.example/confirm/plain-token");
  });
});

describe("sendInvitationEmail", () => {
  it("sends the evaluator email with the public confirmation link", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);

    await sendInvitationEmail(
      {
        sendMail,
      },
      {
        fromAddress: "club@example.com",
        appBaseUrl: "https://toastmasters.example",
      },
      {
        evaluatorName: "Amina Bello",
        evaluatorEmail: "amina@example.com",
        vpeName: "Chiamaka Obi",
        meetingTitle: "Toastmasters Club Meeting",
        meetingDate: "2026-08-15",
        meetingNote: "Please arrive 15 minutes early.",
        token: "plain-token",
      },
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "club@example.com",
        to: "amina@example.com",
        subject: expect.stringContaining("Toastmasters Club Meeting"),
        text: expect.stringContaining("/confirm/plain-token"),
        html: expect.stringContaining("/confirm/plain-token"),
      }),
    );
  });
});
