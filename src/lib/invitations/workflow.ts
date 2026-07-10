import type { BackendClient } from "@/lib/appwrite/client";
import { getEvaluatorById } from "@/lib/evaluators/service";
import type { EvaluatorRecord, InvitationRecord } from "@/lib/types";
import { invitationSchema } from "@/lib/validation/invitation";
import { sendInvitationEmail } from "./email";
import { createInvitationToken } from "./token";

type DeliveryStoreClient = Pick<BackendClient, "collection" | "filter">;

type DeliveryTransport = {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

type DeliveryContext = {
  vpeId: string;
  vpeName: string;
};

type InvitationEditableRecord = {
  id: string;
  evaluator: string;
  meeting_title: string;
  meeting_date: string;
  meeting_note?: string;
  sent_at?: string;
  responded_at?: string;
  status: InvitationRecord["status"];
  token_hash: string;
  expand?: {
    evaluator?: {
      full_name?: string;
      email?: string;
    };
  };
};

type InvitationConflictRecord = Pick<InvitationRecord, "id" | "status" | "vpe">;

export class EvaluatorDateConflictError extends Error {
  constructor(message = "That evaluator is already booked for this meeting date.") {
    super(message);
    this.name = "EvaluatorDateConflictError";
  }
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getInvitationId(formData: FormData) {
  const value = formData.get("invitationId");

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invitation id is required.");
  }

  return value;
}

function getEvaluatorId(formData: FormData) {
  const value = formData.get("evaluatorId");

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Evaluator id is required.");
  }

  return value;
}

function getOptionalPhoto(formData: FormData) {
  const value = formData.get("photo");

  if (!(value instanceof File) || !value.name || value.size <= 0) {
    return null;
  }

  return value;
}

function getInvitationInput(formData: FormData) {
  return invitationSchema.parse({
    meetingTitle: getStringValue(formData, "meetingTitle"),
    meetingDate: getStringValue(formData, "meetingDate"),
    meetingNote: getStringValue(formData, "meetingNote"),
  });
}

async function getInvitationById(
  pb: DeliveryStoreClient,
  invitationId: string,
) {
  return pb.collection("invitations").getFirstListItem<InvitationEditableRecord>(
    pb.filter("$id = {:invitationId}", {
      invitationId,
    }),
    {
      expand: "evaluator",
    },
  );
}

async function assertEvaluatorAvailability(
  pb: DeliveryStoreClient,
  evaluatorId: string,
  meetingDate: string,
  currentInvitationId?: string,
) {
  const existingInvitations = await pb.collection("invitations").getFullList<InvitationConflictRecord>({
    filter: pb.filter("evaluator = {:evaluatorId} && meeting_date = {:meetingDate}", {
      evaluatorId,
      meetingDate,
    }),
  });

  const conflictingInvitation = existingInvitations.find(
    (record) => record.id !== currentInvitationId && record.status !== "declined",
  );

  if (conflictingInvitation) {
    throw new EvaluatorDateConflictError();
  }
}

export async function createConfirmationRequest(
  pb: DeliveryStoreClient,
  transporter: DeliveryTransport,
  config: {
    fromAddress: string;
    appBaseUrl: string;
  },
  context: DeliveryContext,
  formData: FormData,
  now: () => string = () => new Date().toISOString(),
) {
  const invitationInput = getInvitationInput(formData);
  const evaluatorId = getEvaluatorId(formData);
  const photo = getOptionalPhoto(formData);
  const evaluator = await getEvaluatorById(pb, evaluatorId);

  await assertEvaluatorAvailability(pb, evaluator.id, invitationInput.meetingDate);
  if (photo) {
    await pb.collection("evaluators").update(evaluator.id, {
      photo,
    });
  }
  const token = await createInvitationToken();
  const invitation = await pb.collection("invitations").create<InvitationRecord>({
    vpe: context.vpeId,
    evaluator: evaluator.id,
    meeting_title: invitationInput.meetingTitle,
    meeting_date: invitationInput.meetingDate,
    meeting_note: invitationInput.meetingNote,
    status: "pending",
    token_hash: token.tokenHash,
  });

  try {
    await sendInvitationEmail(
      transporter,
      {
        fromAddress: config.fromAddress,
        appBaseUrl: config.appBaseUrl,
      },
      {
        evaluatorName: evaluator.full_name,
        evaluatorEmail: evaluator.email,
        vpeName: context.vpeName,
        meetingTitle: invitationInput.meetingTitle,
        meetingDate: invitationInput.meetingDate,
        meetingNote: invitationInput.meetingNote,
        token: token.token,
      },
    );

    await pb.collection("invitations").update(invitation.id, {
      sent_at: now(),
    });
  } catch (error) {
    await pb.collection("invitations").delete(invitation.id);
    throw error;
  }
}

export async function rescheduleInvitation(
  pb: DeliveryStoreClient,
  transporter: DeliveryTransport,
  config: {
    fromAddress: string;
    appBaseUrl: string;
  },
  context: DeliveryContext,
  formData: FormData,
  now: () => string = () => new Date().toISOString(),
) {
  const invitationId = getInvitationId(formData);
  const input = getInvitationInput(formData);
  // #region debug-point C:reschedule-start
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "src/lib/invitations/workflow.ts:rescheduleInvitation:start",
      msg: "[DEBUG] Starting invitation reschedule",
      data: {
        invitationId,
        meetingDate: input.meetingDate,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const record = await getInvitationById(pb, invitationId);
  const token = await createInvitationToken();
  const previousInvitationState = {
    meeting_title: record.meeting_title,
    meeting_date: record.meeting_date,
    meeting_note: record.meeting_note ?? "",
    responded_at: record.responded_at ?? "",
    sent_at: record.sent_at ?? "",
    status: record.status,
    token_hash: record.token_hash,
  };

  // #region debug-point C:reschedule-record
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "src/lib/invitations/workflow.ts:rescheduleInvitation:record",
      msg: "[DEBUG] Loaded invitation for reschedule",
      data: {
        invitationId: record.id,
        status: record.status,
        evaluatorEmail: record.expand?.evaluator?.email ?? "",
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  await assertEvaluatorAvailability(pb, record.evaluator, input.meetingDate, invitationId);

  await pb.collection("invitations").update(invitationId, {
    meeting_title: input.meetingTitle,
    meeting_date: input.meetingDate,
    meeting_note: input.meetingNote,
    responded_at: "",
    sent_at: now(),
    status: "pending",
    token_hash: token.tokenHash,
  });

  // #region debug-point C:reschedule-updated
  await fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "confirm-reschedule-load",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "src/lib/invitations/workflow.ts:rescheduleInvitation:updated",
      msg: "[DEBUG] Updated invitation before resend",
      data: {
        invitationId,
        nextStatus: "pending",
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  try {
    await sendInvitationEmail(
      transporter,
      {
        fromAddress: config.fromAddress,
        appBaseUrl: config.appBaseUrl,
      },
      {
        evaluatorName: record.expand?.evaluator?.full_name ?? "Evaluator",
        evaluatorEmail: record.expand?.evaluator?.email ?? "",
        vpeName: context.vpeName,
        meetingTitle: input.meetingTitle,
        meetingDate: input.meetingDate,
        meetingNote: input.meetingNote,
        token: token.token,
      },
    );
    // #region debug-point C:reschedule-success
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "src/lib/invitations/workflow.ts:rescheduleInvitation:success",
        msg: "[DEBUG] Reschedule email sent successfully",
        data: {
          invitationId,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    // #region debug-point C:reschedule-failed
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "src/lib/invitations/workflow.ts:rescheduleInvitation:failed",
        msg: "[DEBUG] Reschedule failed and rollback started",
        data: {
          invitationId,
          error: error instanceof Error ? error.message : "unknown-error",
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    await pb.collection("invitations").update(invitationId, previousInvitationState);
    throw error;
  }
}

export async function cancelInvitation(
  pb: DeliveryStoreClient,
  context: DeliveryContext,
  invitationId: string,
) {
  const record = await getInvitationById(pb, invitationId);

  await pb.collection("invitations").delete(record.id);
}
