import type { BackendClient } from "@/lib/appwrite/client";
import type { InvitationRecord, InvitationStatus } from "@/lib/types";

export type InvitationStatusItem = {
  id: string;
  evaluatorName: string;
  evaluatorEmail: string;
  evaluatorProfile: string;
  evaluatorPhotoUrl: string;
  requestedByName: string;
  requestedByEmail: string;
  ownedByCurrentVpe: boolean;
  meetingTitle: string;
  meetingDate: string;
  meetingNote: string;
  status: InvitationStatus;
  sentAt?: string;
  respondedAt?: string;
};

type InvitationStoreClient = Pick<BackendClient, "collection" | "files" | "filter">;

type InvitationRecordWithExpand = Pick<
  InvitationRecord,
  "id" | "meeting_title" | "meeting_date" | "meeting_note" | "status" | "sent_at" | "responded_at"
> & {
  vpe: string;
  expand?: {
    evaluator?: {
      full_name?: string;
      email?: string;
      profile?: string;
      photo?: string;
    };
    vpe?: {
      full_name?: string;
      email?: string;
    };
  };
};

type InvitationStatusListOptions = {
  currentVpeId: string;
  includeAllVpes?: boolean;
  status?: InvitationStatus;
};

function createInvitationScopeFilter(
  pb: Pick<BackendClient, "filter">,
  options: InvitationStatusListOptions,
) {
  if (options.includeAllVpes && options.status) {
    return pb.filter("status = {:status}", { status: options.status });
  }

  if (options.includeAllVpes) {
    return undefined;
  }

  if (!options.status) {
    return pb.filter("vpe = {:vpeId}", { vpeId: options.currentVpeId });
  }

  return pb.filter("vpe = {:vpeId} && status = {:status}", {
    vpeId: options.currentVpeId,
    status: options.status,
  });
}

function isRecoverableBackendListError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (
    error.status === 400 || error.status === 404
  );
}

async function getInvitationRecords(
  pb: InvitationStoreClient,
  options: InvitationStatusListOptions,
) {
  const filter = createInvitationScopeFilter(pb, {
    currentVpeId: options.currentVpeId,
    includeAllVpes: options.includeAllVpes,
    status: options.status,
  });

  try {
    return await pb.collection("invitations").getFullList<InvitationRecordWithExpand>({
      expand: "evaluator,vpe",
      filter,
      sort: "-created",
    });
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "status" in error && error.status === 400)) {
      throw error;
    }

    return pb.collection("invitations").getFullList<InvitationRecordWithExpand>({
      expand: "evaluator,vpe",
      filter,
    });
  }
}

export async function listInvitationStatusItems(
  pb: InvitationStoreClient,
  options: InvitationStatusListOptions,
): Promise<InvitationStatusItem[]> {
  let records: InvitationRecordWithExpand[] = [];

  try {
    records = await getInvitationRecords(pb, options);
  } catch (error) {
    if (!isRecoverableBackendListError(error)) {
      throw error;
    }
  }

  return records.map((record) => ({
    id: record.id,
    evaluatorName: record.expand?.evaluator?.full_name ?? "Unknown evaluator",
    evaluatorEmail: record.expand?.evaluator?.email ?? "",
    evaluatorProfile: record.expand?.evaluator?.profile ?? "",
    evaluatorPhotoUrl: record.expand?.evaluator?.photo
      ? pb.files.getURL(record.expand.evaluator, record.expand.evaluator.photo)
      : "",
    requestedByName: record.expand?.vpe?.full_name ?? "Unknown VPE",
    requestedByEmail: record.expand?.vpe?.email ?? "",
    ownedByCurrentVpe: record.vpe === options.currentVpeId,
    meetingTitle: record.meeting_title,
    meetingDate: record.meeting_date,
    meetingNote: record.meeting_note ?? "",
    status: record.status,
    sentAt: record.sent_at,
    respondedAt: record.responded_at,
  }));
}

export function summarizeInvitationStatuses(items: InvitationStatusItem[]) {
  return items.reduce(
    (summary, item) => {
      if (item.status === "pending") {
        summary.pending += 1;
      }

      if (item.status === "accepted") {
        summary.confirmed += 1;
      }

      if (item.status === "declined") {
        summary.declined += 1;
      }

      return summary;
    },
    { pending: 0, confirmed: 0, declined: 0 },
  );
}
