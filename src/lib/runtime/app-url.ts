import { headers } from "next/headers";
import { getEnv } from "@/lib/config";

export async function getAppBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");

  if (host) {
    const protocol =
      forwardedProto ??
      (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return getEnv().APP_BASE_URL ?? "http://localhost:3000";
}

export function getSmtpHost() {
  return getEnv().SMTP_HOST ?? "smtp.gmail.com";
}
