import type { ContactLeadInput } from "@/lib/validation/contact";

type MailTransport = {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

type MailerConfig = {
  fromAddress: string;
};

export async function sendMitemsHubContactEmail(
  transporter: MailTransport,
  config: MailerConfig,
  input: ContactLeadInput,
) {
  const subject = `New MitemsHub inquiry: ${input.projectType}`;
  const text = [
    "Hello MitemsHub,",
    "",
    "A new website inquiry was submitted from Toast Masters Hub.",
    "",
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Project type: ${input.projectType}`,
    "",
    "Project brief:",
    input.message,
  ].join("\n");
  const html = `
    <p>Hello MitemsHub,</p>
    <p>A new website inquiry was submitted from <strong>Toast Masters Hub</strong>.</p>
    <p><strong>Name:</strong> ${input.fullName}</p>
    <p><strong>Email:</strong> ${input.email}</p>
    <p><strong>Project type:</strong> ${input.projectType}</p>
    <p><strong>Project brief:</strong></p>
    <p>${input.message.replace(/\n/g, "<br />")}</p>
  `;

  await transporter.sendMail({
    from: config.fromAddress,
    to: config.fromAddress,
    subject,
    text,
    html,
  });
}
