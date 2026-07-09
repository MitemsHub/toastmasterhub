import type PocketBase from "pocketbase";
import type { EvaluatorRecord } from "@/lib/types";
import { evaluatorSchema } from "@/lib/validation/evaluator";

type EvaluatorDirectoryItem = {
  id: string;
  name: string;
  email: string;
  profile: string;
  photoUrl: string;
  createdAt: string;
};

type EvaluatorDirectoryClient = Pick<PocketBase, "collection" | "files" | "filter">;
type EvaluatorCreateClient = Pick<PocketBase, "collection">;

function isRecoverablePocketBaseListError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (
    error.status === 400 || error.status === 404
  );
}

async function getEvaluatorRecords(
  pb: EvaluatorDirectoryClient,
  vpeId: string,
) {
  const filter = pb.filter("vpe = {:vpeId}", { vpeId });

  try {
    return await pb.collection("evaluators").getFullList<EvaluatorRecord>({
      filter,
      sort: "-created",
    });
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "status" in error && error.status === 400)) {
      throw error;
    }

    return pb.collection("evaluators").getFullList<EvaluatorRecord>({
      filter,
    });
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
  vpeId: string,
): Promise<EvaluatorDirectoryItem[]> {
  let records: EvaluatorRecord[] = [];

  try {
    records = await getEvaluatorRecords(pb, vpeId);
  } catch (error) {
    if (!isRecoverablePocketBaseListError(error)) {
      throw error;
    }
  }

  return records.map((record) => ({
    id: record.id,
    name: record.full_name,
    email: record.email,
    profile: record.profile,
    photoUrl: pb.files.getURL(record, record.photo),
    createdAt: record.created ?? "",
  }));
}

export async function createEvaluatorProfile(
  pb: EvaluatorCreateClient,
  formData: FormData,
  vpeId: string,
) {
  const photo = getPhotoFile(formData);
  const input = evaluatorSchema.parse({
    fullName: getStringValue(formData, "fullName"),
    email: getStringValue(formData, "email"),
    profile: getStringValue(formData, "profile"),
    photoPath: photo.name,
  });

  return pb.collection("evaluators").create({
    vpe: vpeId,
    full_name: input.fullName,
    email: input.email,
    profile: input.profile,
    photo,
  });
}
