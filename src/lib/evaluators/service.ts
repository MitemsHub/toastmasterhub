import type { BackendClient } from "@/lib/appwrite/client";
import { isGeneratedEvaluatorPhotoName } from "@/lib/evaluators/photo";
import { formatPhoneNumberForDisplay, normalizePhoneNumber } from "@/lib/evaluators/phone";
import type { EvaluatorRecord } from "@/lib/types";
import { evaluatorSchema } from "@/lib/validation/evaluator";

type EvaluatorDirectoryItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string;
  photoUrl: string;
  createdAt: string;
  createdByVpeId: string;
};

export type EvaluatorProfileInput = {
  fullName: string;
  email: string;
  phone: string;
  profile: string;
  photo: File;
};

type EvaluatorDirectoryClient = Pick<BackendClient, "collection" | "files">;
type EvaluatorCreateClient = Pick<BackendClient, "collection" | "filter">;
type EvaluatorLookupClient = Pick<BackendClient, "collection" | "filter">;

export class DuplicateEvaluatorError extends Error {
  constructor(message = "This evaluator already exists in the shared directory.") {
    super(message);
    this.name = "DuplicateEvaluatorError";
  }
}

function isRecoverableBackendListError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (
    error.status === 400 || error.status === 404
  );
}

async function getEvaluatorRecords(pb: EvaluatorDirectoryClient) {
  try {
    return await pb.collection("evaluators").getFullList<EvaluatorRecord>({
      sort: "-created",
    });
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "status" in error && error.status === 400)) {
      throw error;
    }

    return pb.collection("evaluators").getFullList<EvaluatorRecord>({
    });
  }
}

async function resolveEvaluatorPhotoUrl(
  pb: EvaluatorDirectoryClient,
  record: EvaluatorRecord,
) {
  if (!record.photo) {
    return "";
  }

  try {
    const photoInfo = await pb.files.getInfo(record.photo);

    if (isGeneratedEvaluatorPhotoName(photoInfo.name ?? "")) {
      return "";
    }
  } catch {
    // Keep rendering the saved portrait URL if file metadata lookup fails.
  }

  return pb.files.getURL(record, record.photo);
}

async function findEvaluatorByEmail(
  pb: EvaluatorLookupClient,
  email: string,
) {
  try {
    return await pb.collection("evaluators").getFirstListItem<EvaluatorRecord>(
      pb.filter("email = {:email}", {
        email,
      }),
    );
  } catch (error) {
    if (isRecoverableBackendListError(error)) {
      return null;
    }

    throw error;
  }
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getPhotoFile(formData: FormData) {
  const photo = formData.get("photo");

  if (!(photo instanceof File) || !photo.name) {
    throw new Error("A photo file is required.");
  }

  return photo;
}

export async function listEvaluatorDirectoryItems(
  pb: EvaluatorDirectoryClient,
): Promise<EvaluatorDirectoryItem[]> {
  let records: EvaluatorRecord[] = [];

  try {
    records = await getEvaluatorRecords(pb);
  } catch (error) {
    if (!isRecoverableBackendListError(error)) {
      throw error;
    }
  }

  return Promise.all(
    records.map(async (record) => ({
      id: record.id,
      name: record.full_name,
      email: record.email,
      phone: formatPhoneNumberForDisplay(record.phone ?? ""),
      profile: record.profile,
      photoUrl: await resolveEvaluatorPhotoUrl(pb, record),
      createdAt: record.created ?? "",
      createdByVpeId: record.vpe,
    })),
  );
}

export async function getEvaluatorById(
  pb: Pick<BackendClient, "collection">,
  evaluatorId: string,
) {
  return pb.collection("evaluators").getOne<EvaluatorRecord>(evaluatorId);
}

export async function updateEvaluatorProfile(
  pb: Pick<BackendClient, "collection" | "filter">,
  evaluatorId: string,
  formData: FormData,
) {
  const input = evaluatorSchema.parse({
    fullName: getStringValue(formData, "fullName"),
    email: getStringValue(formData, "email"),
    phone: normalizePhoneNumber(getStringValue(formData, "phone")),
    profile: getStringValue(formData, "profile"),
    photoPath: "existing-photo",
  });

  const existingEvaluator = await findEvaluatorByEmail(pb, input.email);

  if (existingEvaluator && existingEvaluator.id !== evaluatorId) {
    throw new DuplicateEvaluatorError();
  }

  return pb.collection("evaluators").update<EvaluatorRecord>(evaluatorId, {
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    profile: input.profile,
  });
}

export async function deleteEvaluatorProfile(
  pb: Pick<BackendClient, "collection">,
  evaluatorId: string,
) {
  await pb.collection("evaluators").delete(evaluatorId);
}

export async function createEvaluatorProfileFromInput(
  pb: EvaluatorCreateClient,
  input: EvaluatorProfileInput,
  vpeId: string,
): Promise<EvaluatorRecord> {
  const existingEvaluator = await findEvaluatorByEmail(pb, input.email);

  if (existingEvaluator) {
    throw new DuplicateEvaluatorError();
  }

  return pb.collection("evaluators").create<EvaluatorRecord>({
    vpe: vpeId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    profile: input.profile,
    photo: input.photo,
  });
}

export async function createEvaluatorProfile(
  pb: EvaluatorCreateClient,
  formData: FormData,
  vpeId: string,
): Promise<EvaluatorRecord> {
  const photo = getPhotoFile(formData);
  const input = evaluatorSchema.parse({
    fullName: getStringValue(formData, "fullName"),
    email: getStringValue(formData, "email"),
    phone: normalizePhoneNumber(getStringValue(formData, "phone")),
    profile: getStringValue(formData, "profile"),
    photoPath: photo.name,
  });

  return createEvaluatorProfileFromInput(
    pb,
    {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      profile: input.profile,
      photo,
    },
    vpeId,
  );
}
