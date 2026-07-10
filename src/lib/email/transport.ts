import nodemailer from "nodemailer";
import { getEnv } from "@/lib/config";
import { getSmtpHost } from "@/lib/runtime/app-url";

type MailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type MailTransport = {
  sendMail(message: MailMessage): Promise<unknown>;
};

type SmtpAttempt = {
  host: string;
  port: number;
};

type SmtpError = Error & {
  code?: string;
  command?: string;
};

const RETRYABLE_SMTP_CODES = new Set([
  "ECONNECTION",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "ESOCKET",
  "ETIMEDOUT",
]);

function isGmailHost(host: string) {
  return host === "smtp.gmail.com" || host === "smtp.googlemail.com";
}

function isRetryableSmtpError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const smtpError = error as SmtpError;
  const message = error.message.toLowerCase();

  return (
    (smtpError.code ? RETRYABLE_SMTP_CODES.has(smtpError.code) : false) ||
    message.includes("connection timeout") ||
    message.includes("greeting never received") ||
    message.includes("invalid greeting") ||
    message.includes("starttls")
  );
}

function buildAttemptList(host: string, preferredPort: number) {
  const attempts: SmtpAttempt[] = [{ host, port: preferredPort }];

  if (isGmailHost(host)) {
    if (preferredPort !== 465) {
      attempts.push({ host, port: 465 });
    }

    if (preferredPort !== 587) {
      attempts.push({ host, port: 587 });
    }
  }

  return attempts;
}

function createAttemptTransport(attempt: SmtpAttempt) {
  const env = getEnv();

  return nodemailer.createTransport({
    host: attempt.host,
    port: attempt.port,
    secure: attempt.port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 10000,
  });
}

export function createMailTransport(): MailTransport {
  const env = getEnv();
  const host = getSmtpHost();
  const attempts = buildAttemptList(host, env.SMTP_PORT);

  return {
    async sendMail(message: MailMessage) {
      let lastError: unknown;

      for (const [index, attempt] of attempts.entries()) {
        try {
          const transport = createAttemptTransport(attempt);
          return await transport.sendMail(message);
        } catch (error) {
          lastError = error;

          const hasNextAttempt = index < attempts.length - 1;

          if (!hasNextAttempt || !isRetryableSmtpError(error)) {
            throw error;
          }
        }
      }

      throw lastError instanceof Error ? lastError : new Error("Email delivery failed.");
    },
  };
}
