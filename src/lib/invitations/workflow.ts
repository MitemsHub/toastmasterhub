import type { BackendClient } from "@/lib/appwrite/client";
import { createEvaluatorProfile } from "@/lib/evaluators/service";
import type { InvitationRecord } from "@/lib/types";
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
  meeting_title: string;
  meeting_date: string;
  meeting_note?: string;
  expand?: {
    evaluator?: {
      full_name?: string;
      email?: string;
    };
  };
};

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

function getInvitationInput(formData: FormData) {
  return invitationSchema.parse({
    meetingTitle: getStringValue(formData, "meetingTitle"),
    meetingDate: getStringValue(formData, "meetingDate"),
    meetingNote: getStringValue(formData, "meetingNote"),
  });
}

async function getScopedInvitation(
  pb: DeliveryStoreClient,
  vpeId: string,
  invitationId: string,
) {
  return pb.collection("invitations").getFirstListItem<InvitationEditableRecord>(
    pb.filter("id = {:invitationId} && vpe = {:vpeId}", {
      invitationId,
      vpeId,
    }),
    {
      expand: "evaluator",
    },
  );
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
  const evaluator = await createEvaluatorProfile(pb, formData, context.vpeId);
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
  const record = await getScopedInvitation(pb, context.vpeId, invitationId);
  const token = await createInvitationToken();

  await pb.collection("invitations").update(invitationId, {
    meeting_title: input.meetingTitle,
    meeting_date: input.meetingDate,
    meeting_note: input.meetingNote,
    responded_at: "",
    sent_at: now(),
    status: "pending",
    token_hash: token.tokenHash,
  });

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
}

export async function cancelInvitation(
  pb: DeliveryStoreClient,
  context: DeliveryContext,
  invitationId: string,
) {
  const record = await getScopedInvitation(pb, context.vpeId, invitationId);

  await pb.collection("invitations").delete(record.id);
}
