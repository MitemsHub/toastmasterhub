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
  appBaseUrl: string;
};

type InvitationEmailInput = {
  evaluatorName: string;
  evaluatorEmail: string;
  vpeName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingNote?: string;
  token: string;
};

export function buildInvitationConfirmationUrl(token: string, appBaseUrl: string) {
  const baseUrl = appBaseUrl.endsWith("/") ? appBaseUrl.slice(0, -1) : appBaseUrl;

  return `${baseUrl}/confirm/${token}`;
}

export async function sendInvitationEmail(
  transporter: MailTransport,
  config: MailerConfig,
  invitation: InvitationEmailInput,
) {
  const confirmationUrl = buildInvitationConfirmationUrl(
    invitation.token,
    config.appBaseUrl,
  );
  const subject = `${invitation.meetingTitle} availability confirmation`;
  const noteSection = invitation.meetingNote
    ? `Meeting note: ${invitation.meetingNote}`
    : "Meeting note: None provided.";
  const text = [
    `Hello ${invitation.evaluatorName},`,
    "",
    `${invitation.vpeName} is requesting your response for ${invitation.meetingTitle}.`,
    `Meeting date: ${invitation.meetingDate}`,
    noteSection,
    "",
    `Open your confirmation page here: ${confirmationUrl}`,
  ].join("\n");
  const html = `
    <p>Hello ${invitation.evaluatorName},</p>
    <p><strong>${invitation.vpeName}</strong> is requesting your response for <strong>${invitation.meetingTitle}</strong>.</p>
    <p>Meeting date: <strong>${invitation.meetingDate}</strong></p>
    <p>${noteSection}</p>
    <p><a href="${confirmationUrl}">Open your confirmation page</a></p>
  `;

  await transporter.sendMail({
    from: config.fromAddress,
    to: invitation.evaluatorEmail,
    subject,
    text,
    html,
  });
}
