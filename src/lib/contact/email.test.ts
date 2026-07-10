import { describe, expect, it, vi } from "vitest";
import { sendMitemsHubContactEmail } from "./email";

describe("sendMitemsHubContactEmail", () => {
  it("sends the inquiry through the configured SMTP mailbox", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);

    await sendMitemsHubContactEmail(
      { sendMail },
      { fromAddress: "club@example.com" },
      {
        fullName: "Chuks Mitti",
        email: "chuks@example.com",
        projectType: "Custom website",
        message: "I want a website and dashboard for our business.",
      },
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "club@example.com",
        to: "club@example.com",
        subject: "New MitemsHub inquiry: Custom website",
        text: expect.stringContaining("Chuks Mitti"),
        html: expect.stringContaining("I want a website and dashboard for our business."),
      }),
    );
  });
});
