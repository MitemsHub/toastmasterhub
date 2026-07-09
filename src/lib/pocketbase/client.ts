import PocketBase from "pocketbase";
import { getEnv } from "@/lib/config";

export function createPocketBaseClient() {
  const env = getEnv();

  return new PocketBase(env.POCKETBASE_URL);
}

export async function getPocketBaseAdmin() {
  const env = getEnv();
  const pb = new PocketBase(env.POCKETBASE_URL);
  await pb.collection("_superusers").authWithPassword(
    env.POCKETBASE_ADMIN_EMAIL,
    env.POCKETBASE_ADMIN_PASSWORD,
  );

  return pb;
}
