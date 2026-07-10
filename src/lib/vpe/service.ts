import { randomBytes } from "node:crypto";
import type { BackendClient } from "@/lib/appwrite/client";
import { isValidVpeSession, parseVpeSessionValue, hashAccessCode } from "@/lib/auth/vpe-session";
import type { VpeRecord } from "@/lib/types";
import { accessCodeSchema, vpeSignupSchema } from "@/lib/validation/vpe";
import { sendVpeAccessCodeEmail } from "./email";

type VpeClient = Pick<BackendClient, "collection" | "filter">;

type DeliveryTransport = {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

export type AuthenticatedVpe = {
  id: string;
  name: string;
  email: string;
  accessCodeHash: string;
};

export class InvalidSignupOtcError extends Error {
  constructor() {
    super("The signup OTC is invalid.");
    this.name = "InvalidSignupOtcError";
  }
}

export class VpeAccessDeliveryError extends Error {
  accessCode: string;
  vpe: AuthenticatedVpe;
  cause?: unknown;

  constructor(input: { accessCode: string; vpe: AuthenticatedVpe; cause?: unknown }) {
    super("The access code was created but email delivery failed.");
    this.name = "VpeAccessDeliveryError";
    this.accessCode = input.accessCode;
    this.vpe = input.vpe;
    this.cause = input.cause;
  }
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function mapAuthenticatedVpe(record: Pick<VpeRecord, "id" | "full_name" | "email" | "access_code_hash">) {
  return {
    id: record.id,
    name: record.full_name,
    email: record.email,
    accessCodeHash: record.access_code_hash,
  };
}

function normalizeSignupOtc(value: string) {
  return value.trim().toUpperCase();
}

export function generateAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  const characters = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);

  return `${characters.slice(0, 4).join("")}-${characters.slice(4).join("")}`;
}

async function findVpeByEmail(pb: VpeClient, email: string) {
  try {
    return await pb.collection("vpes").getFirstListItem<VpeRecord>(
      pb.filter("email = {:email}", { email }),
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createOrRefreshVpeAccess(
  pb: VpeClient,
  transporter: DeliveryTransport,
  config: {
    fromAddress: string;
    signupOtc: string;
  },
  formData: FormData,
  now: () => string = () => new Date().toISOString(),
) {
  const input = vpeSignupSchema.parse({
    fullName: getStringValue(formData, "fullName"),
    email: getStringValue(formData, "email"),
    signupOtc: getStringValue(formData, "signupOtc"),
  });

  if (normalizeSignupOtc(input.signupOtc) !== normalizeSignupOtc(config.signupOtc)) {
    throw new InvalidSignupOtcError();
  }

  const accessCode = generateAccessCode();
  const accessCodeHash = hashAccessCode(accessCode);
  const existing = await findVpeByEmail(pb, input.email);

  const payload = {
    full_name: input.fullName,
    email: input.email,
    access_code_hash: accessCodeHash,
    access_code_last_sent_at: now(),
  };

  const vpe = existing
    ? await pb.collection("vpes").update<VpeRecord>(existing.id, payload)
    : await pb.collection("vpes").create<VpeRecord>(payload);

  try {
    await sendVpeAccessCodeEmail(
      transporter,
      { fromAddress: config.fromAddress },
      {
        fullName: input.fullName,
        email: input.email,
        accessCode,
      },
    );
  } catch (error) {
    throw new VpeAccessDeliveryError({
      accessCode,
      vpe: mapAuthenticatedVpe(vpe),
      cause: error,
    });
  }

  return {
    accessCode,
    vpe: mapAuthenticatedVpe(vpe),
  };
}

export async function authenticateVpeWithAccessCode(pb: VpeClient, inputCode: string) {
  const parsed = accessCodeSchema.parse({
    accessCode: inputCode,
  });

  try {
    const record = await pb.collection("vpes").getFirstListItem<VpeRecord>(
      pb.filter("access_code_hash = {:accessCodeHash}", {
        accessCodeHash: hashAccessCode(parsed.accessCode),
      }),
    );

    return mapAuthenticatedVpe(record);
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getAuthenticatedVpe(pb: VpeClient, sessionValue: string | undefined) {
  if (!sessionValue) {
    return null;
  }

  const parsed = parseVpeSessionValue(sessionValue);

  if (!parsed) {
    return null;
  }

  try {
    const record = await pb.collection("vpes").getOne<VpeRecord>(parsed.vpeId);

    if (
      !isValidVpeSession(sessionValue, {
        vpeId: record.id,
        accessCodeHash: record.access_code_hash,
      })
    ) {
      return null;
    }

    return mapAuthenticatedVpe(record);
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}
