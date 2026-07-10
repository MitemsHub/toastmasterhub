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
  const record = await pb.collection("invitations").getFirstListItem<InvitationPendingRecord>(
    createInvitationTokenFilter(pb, input.token),
  );

  if (record.status !== "pending") {
    throw new Error("This invitation has already been responded to.");
  }

  await pb.collection("invitations").update(record.id, {
    status: input.response,
    responded_at: now(),
  });
}
