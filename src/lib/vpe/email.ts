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

type VpeAccessEmailInput = {
  fullName: string;
  email: string;
  accessCode: string;
};

export async function sendVpeAccessCodeEmail(
  transporter: MailTransport,
  config: MailerConfig,
  input: VpeAccessEmailInput,
) {
  const subject = "Your Toast Masters Hub access code";
  const text = [
    `Hello ${input.fullName},`,
    "",
    "Your Toast Masters Hub access code is ready.",
    `Access code: ${input.accessCode}`,
    "",
    "Use it on the club access screen to open your workspace.",
  ].join("\n");
  const html = `
    <p>Hello ${input.fullName},</p>
    <p>Your <strong>Toast Masters Hub</strong> access code is ready.</p>
    <p><strong>Access code:</strong> ${input.accessCode}</p>
    <p>Use it on the club access screen to open your workspace.</p>
  `;

  await transporter.sendMail({
    from: config.fromAddress,
    to: input.email,
    subject,
    text,
    html,
  });
}
