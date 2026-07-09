import { describe, expect, it, vi } from "vitest";
import { sendVpeAccessCodeEmail } from "./email";

describe("sendVpeAccessCodeEmail", () => {
  it("sends the VPE access code email", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);

    await sendVpeAccessCodeEmail(
      { sendMail },
      { fromAddress: "club@example.com" },
      {
        fullName: "Amina Bello",
        email: "amina@example.com",
        accessCode: "ABCD-9F4K",
      },
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "club@example.com",
        to: "amina@example.com",
        subject: expect.stringContaining("access code"),
        text: expect.stringContaining("ABCD-9F4K"),
      }),
    );
  });
});
