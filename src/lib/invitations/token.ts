import { createHash, randomBytes } from "node:crypto";

type InvitationToken = {
  token: string;
  tokenHash: string;
};

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitationToken(): Promise<InvitationToken> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(token);

  return {
    token,
    tokenHash,
  };
}
