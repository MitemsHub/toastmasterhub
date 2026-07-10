import type { BackendClient } from "@/lib/appwrite/client";
import type { InvitationStatus } from "@/lib/types";
import { hashInvitationToken } from "./token";

export type InvitationConfirmationDetails = {
  invitationId: string;
  evaluatorName: string;
  evaluatorProfile: string;
  evaluatorPhotoUrl: string;
  meetingTitle: string;
  meetingDate: string;
  meetingNote: string;
  status: InvitationStatus;
  canRespond: boolean;
};

type InvitationResponseClient = Pick<BackendClient, "collection" | "filter" | "files">;
type InvitationMutationClient = Pick<BackendClient, "collection" | "filter">;

type InvitationLookupRecord = {
  id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_note?: string;
  status: InvitationStatus;
  expand?: {
    evaluator?: {
      full_name?: string;
      profile?: string;
      photo?: string;
    };
  };
};

type InvitationPendingRecord = {
  id: string;
  status: InvitationStatus;
};

function createInvitationTokenFilter(pb: Pick<BackendClient, "filter">, token: string) {
  return pb.filter("token_hash = {:tokenHash}", {
    tokenHash: hashInvitationToken(token),
  });
}

export async function getInvitationConfirmationDetails(
  pb: InvitationResponseClient,
  token: string,
): Promise<InvitationConfirmationDetails | null> {
  try {
    const record = await pb.collection("invitations").getFirstListItem<InvitationLookupRecord>(
      createInvitationTokenFilter(pb, token),
      { expand: "evaluator" },
    );
    const evaluator = record.expand?.evaluator;

    return {
      invitationId: record.id,
      evaluatorName: evaluator?.full_name ?? "Unknown evaluator",
      evaluatorProfile: evaluator?.profile ?? "",
      evaluatorPhotoUrl: evaluator?.photo ? pb.files.getURL(evaluator, evaluator.photo) : "",
      meetingTitle: record.meeting_title,
      meetingDate: record.meeting_date,
      meetingNote: record.meeting_note ?? "",
      status: record.status,
      canRespond: record.status === "pending",
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function respondToInvitation(
  pb: InvitationMutationClient,
  input: {
    token: string;
    response: Extract<InvitationStatus, "accepted" | "declined">;
  },
  now: () => string = () => new Date().toISOString(),
) {
  // #region debug-point B:respond-start
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "src/lib/invitations/response.ts:respondToInvitation:start",
      msg: "[DEBUG] Starting invitation response mutation",
      data: {
        response: input.response,
        tokenLength: input.token.length,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const record = await pb.collection("invitations").getFirstListItem<InvitationPendingRecord>(
    createInvitationTokenFilter(pb, input.token),
  );

  // #region debug-point B:respond-record
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "src/lib/invitations/response.ts:respondToInvitation:record",
      msg: "[DEBUG] Loaded invitation record for response",
      data: {
        invitationId: record.id,
        status: record.status,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (record.status !== "pending") {
    // #region debug-point B:respond-locked
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "src/lib/invitations/response.ts:respondToInvitation:locked",
        msg: "[DEBUG] Invitation response rejected because status is not pending",
        data: {
          invitationId: record.id,
          status: record.status,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error("This invitation has already been responded to.");
  }

  await pb.collection("invitations").update(record.id, {
    status: input.response,
    responded_at: now(),
  });

  // #region debug-point B:respond-success
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "src/lib/invitations/response.ts:respondToInvitation:success",
      msg: "[DEBUG] Invitation response mutation completed",
      data: {
        invitationId: record.id,
        response: input.response,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}
