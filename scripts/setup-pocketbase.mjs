import PocketBase from "pocketbase";

const url = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required.");
}

const pb = new PocketBase(url);

function createBaseCollectionPayload(name, fields, indexes = []) {
  return {
    name,
    type: "base",
    fields,
    indexes,
  };
}

async function ensureCollection(name, createPayload) {
  try {
    const existing = await pb.collections.getFirstListItem(`name="${name}"`);
    console.log(`Collection already exists: ${existing.name}`);
    return existing;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status !== 404) {
      throw error;
    }
  }

  const created = await pb.collections.create(createPayload);
  console.log(`Created collection: ${created.name}`);
  return created;
}

await pb.collection("_superusers").authWithPassword(email, password);

const vpes = await ensureCollection(
  "vpes",
  createBaseCollectionPayload(
    "vpes",
    [
      { name: "full_name", type: "text", required: true },
      { name: "email", type: "email", required: true },
      { name: "access_code_hash", type: "text", required: true },
      { name: "access_code_last_sent_at", type: "date" },
    ],
    [
      "CREATE UNIQUE INDEX idx_vpes_email ON vpes (email)",
      "CREATE UNIQUE INDEX idx_vpes_access_code_hash ON vpes (access_code_hash)",
    ],
  ),
);

const evaluators = await ensureCollection(
  "evaluators",
  createBaseCollectionPayload(
    "evaluators",
    [
      {
        name: "vpe",
        type: "relation",
        required: true,
        collectionId: vpes.id,
        minSelect: 1,
        maxSelect: 1,
      },
      { name: "full_name", type: "text", required: true },
      { name: "email", type: "email", required: true },
      { name: "profile", type: "text", required: true },
      {
        name: "photo",
        type: "file",
        required: true,
        maxSelect: 1,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
    ],
    ["CREATE UNIQUE INDEX idx_evaluators_email ON evaluators (email)"],
  ),
);

await ensureCollection(
  "invitations",
  createBaseCollectionPayload("invitations", [
    {
      name: "vpe",
      type: "relation",
      required: true,
      collectionId: vpes.id,
      minSelect: 1,
      maxSelect: 1,
    },
    {
      name: "evaluator",
      type: "relation",
      required: true,
      collectionId: evaluators.id,
      minSelect: 1,
      maxSelect: 1,
    },
    { name: "meeting_title", type: "text", required: true },
    { name: "meeting_date", type: "date", required: true },
    { name: "meeting_note", type: "text" },
    {
      name: "status",
      type: "select",
      required: true,
      maxSelect: 1,
      values: ["pending", "accepted", "declined"],
    },
    { name: "token_hash", type: "text", required: true },
    { name: "sent_at", type: "date" },
    { name: "responded_at", type: "date" },
    { name: "decline_note", type: "text" },
  ], [
    "CREATE UNIQUE INDEX idx_invitations_token_hash ON invitations (token_hash)",
  ]),
);

console.log("PocketBase collections are ready.");
