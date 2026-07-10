import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

loadEnvFile(envPath);

const requiredEnvKeys = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_VPES_COLLECTION_ID",
  "APPWRITE_EVALUATORS_COLLECTION_ID",
  "APPWRITE_INVITATIONS_COLLECTION_ID",
  "APPWRITE_STORAGE_BUCKET_ID",
];

for (const key of requiredEnvKeys) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  endpoint: normalizeEndpoint(process.env.APPWRITE_ENDPOINT),
  projectId: process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  vpesCollectionId: process.env.APPWRITE_VPES_COLLECTION_ID,
  evaluatorsCollectionId: process.env.APPWRITE_EVALUATORS_COLLECTION_ID,
  invitationsCollectionId: process.env.APPWRITE_INVITATIONS_COLLECTION_ID,
  storageBucketId: process.env.APPWRITE_STORAGE_BUCKET_ID,
};

const DATABASE_NAME = "Toast Masters Hub";

const collections = [
  {
    id: env.vpesCollectionId,
    name: "VPEs",
    attributes: [
      { type: "string", key: "full_name", size: 255, required: true },
      { type: "email", key: "email", required: true },
      { type: "string", key: "access_code_hash", size: 255, required: true },
      { type: "string", key: "access_code_last_sent_at", size: 64, required: false },
    ],
    indexes: [
      { key: "email_unique", type: "unique", attributes: ["email"], orders: ["ASC"] },
      {
        key: "access_code_hash_unique",
        type: "unique",
        attributes: ["access_code_hash"],
        orders: ["ASC"],
      },
    ],
  },
  {
    id: env.evaluatorsCollectionId,
    name: "Evaluators",
    attributes: [
      { type: "string", key: "vpe", size: 64, required: true },
      { type: "string", key: "full_name", size: 255, required: true },
      { type: "email", key: "email", required: true },
      { type: "string", key: "profile", size: 5000, required: true },
      { type: "string", key: "photo", size: 255, required: true },
    ],
    indexes: [
      { key: "vpe_key", type: "key", attributes: ["vpe"], orders: ["ASC"] },
      { key: "email_key", type: "key", attributes: ["email"], orders: ["ASC"] },
    ],
  },
  {
    id: env.invitationsCollectionId,
    name: "Invitations",
    attributes: [
      { type: "string", key: "vpe", size: 64, required: true },
      { type: "string", key: "evaluator", size: 64, required: true },
      { type: "string", key: "meeting_title", size: 255, required: true },
      { type: "string", key: "meeting_date", size: 128, required: true },
      { type: "string", key: "meeting_note", size: 5000, required: false },
      {
        type: "enum",
        key: "status",
        elements: ["pending", "accepted", "declined"],
        required: true,
      },
      { type: "string", key: "token_hash", size: 255, required: true },
      { type: "string", key: "sent_at", size: 64, required: false },
      { type: "string", key: "responded_at", size: 64, required: false },
      { type: "string", key: "decline_note", size: 5000, required: false },
    ],
    indexes: [
      { key: "vpe_key", type: "key", attributes: ["vpe"], orders: ["ASC"] },
      { key: "evaluator_key", type: "key", attributes: ["evaluator"], orders: ["ASC"] },
      {
        key: "vpe_status_key",
        type: "key",
        attributes: ["vpe", "status"],
        orders: ["ASC", "ASC"],
      },
      { key: "token_hash_unique", type: "unique", attributes: ["token_hash"], orders: ["ASC"] },
    ],
  },
];

const bucket = {
  id: env.storageBucketId,
  name: "Evaluator Photos",
  permissions: ['read("any")'],
  fileSecurity: false,
  enabled: true,
  maximumFileSize: 5 * 1024 * 1024,
  allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "avif"],
  compression: "none",
  encryption: true,
  antivirus: true,
  transformations: true,
};

await ensureDatabase();

for (const collection of collections) {
  await ensureCollection(collection);
  await ensureAttributes(collection);
  await ensureIndexes(collection);
}

await ensureBucket(bucket);

console.log("\nAppwrite backend setup is complete.");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/u, "$1");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeEndpoint(endpoint) {
  return endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
}

function createHeaders(extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    "X-Appwrite-Project": env.projectId,
    "X-Appwrite-Key": env.apiKey,
    "X-Appwrite-Response-Format": "1.8.0",
    ...extraHeaders,
  };
}

async function appwriteRequest(pathname, { method = "GET", body, expectedStatuses = [200] } = {}) {
  const response = await fetch(`${env.endpoint}${pathname}`, {
    method,
    headers: createHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!expectedStatuses.includes(response.status)) {
    const errorText = await response.text();
    throw new Error(`${method} ${pathname} failed (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function tryGet(pathname) {
  const response = await fetch(`${env.endpoint}${pathname}`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GET ${pathname} failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function ensureDatabase() {
  const existing = await tryGet(`/databases/${env.databaseId}`);

  if (existing) {
    console.log(`Database already exists: ${env.databaseId}`);
    return existing;
  }

  console.log(`Creating database: ${env.databaseId}`);

  return appwriteRequest("/databases", {
    method: "POST",
    body: {
      databaseId: env.databaseId,
      name: DATABASE_NAME,
      enabled: true,
    },
    expectedStatuses: [201],
  });
}

async function ensureCollection(collection) {
  const existing = await tryGet(`/databases/${env.databaseId}/collections/${collection.id}`);

  if (existing) {
    console.log(`Collection already exists: ${collection.id}`);
    return existing;
  }

  console.log(`Creating collection: ${collection.id}`);

  return appwriteRequest(`/databases/${env.databaseId}/collections`, {
    method: "POST",
    body: {
      collectionId: collection.id,
      name: collection.name,
      permissions: [],
      documentSecurity: false,
      enabled: true,
    },
    expectedStatuses: [201],
  });
}

async function ensureAttributes(collection) {
  const attributes = await listAttributes(collection.id);
  const existingKeys = new Set(attributes.map((attribute) => attribute.key));

  for (const attribute of collection.attributes) {
    if (existingKeys.has(attribute.key)) {
      console.log(`Attribute already exists: ${collection.id}.${attribute.key}`);
      continue;
    }

    console.log(`Creating attribute: ${collection.id}.${attribute.key}`);

    if (attribute.type === "string") {
      await appwriteRequest(
        `/databases/${env.databaseId}/collections/${collection.id}/attributes/string`,
        {
          method: "POST",
          body: {
            key: attribute.key,
            size: attribute.size,
            required: attribute.required,
            array: false,
          },
          expectedStatuses: [202],
        },
      );
    } else if (attribute.type === "email") {
      await appwriteRequest(
        `/databases/${env.databaseId}/collections/${collection.id}/attributes/email`,
        {
          method: "POST",
          body: {
            key: attribute.key,
            required: attribute.required,
            array: false,
          },
          expectedStatuses: [202],
        },
      );
    } else if (attribute.type === "enum") {
      await appwriteRequest(
        `/databases/${env.databaseId}/collections/${collection.id}/attributes/enum`,
        {
          method: "POST",
          body: {
            key: attribute.key,
            elements: attribute.elements,
            required: attribute.required,
            array: false,
          },
          expectedStatuses: [202],
        },
      );
    } else {
      throw new Error(`Unsupported attribute type: ${attribute.type}`);
    }

    await waitForAttribute(collection.id, attribute.key);
  }
}

async function ensureIndexes(collection) {
  const indexes = await listIndexes(collection.id);
  const existingKeys = new Set(indexes.map((index) => index.key));

  for (const index of collection.indexes) {
    if (existingKeys.has(index.key)) {
      console.log(`Index already exists: ${collection.id}.${index.key}`);
      continue;
    }

    console.log(`Creating index: ${collection.id}.${index.key}`);

    await appwriteRequest(`/databases/${env.databaseId}/collections/${collection.id}/indexes`, {
      method: "POST",
      body: {
        key: index.key,
        type: index.type,
        attributes: index.attributes,
        orders: index.orders,
      },
      expectedStatuses: [202],
    });

    await waitForIndex(collection.id, index.key);
  }
}

async function ensureBucket(bucketConfig) {
  const existing = await tryGet(`/storage/buckets/${bucketConfig.id}`);

  if (existing) {
    console.log(`Bucket already exists: ${bucketConfig.id}`);
    return existing;
  }

  console.log(`Creating bucket: ${bucketConfig.id}`);

  return appwriteRequest("/storage/buckets", {
    method: "POST",
    body: {
      bucketId: bucketConfig.id,
      name: bucketConfig.name,
      permissions: bucketConfig.permissions,
      fileSecurity: bucketConfig.fileSecurity,
      enabled: bucketConfig.enabled,
      maximumFileSize: bucketConfig.maximumFileSize,
      allowedFileExtensions: bucketConfig.allowedFileExtensions,
      compression: bucketConfig.compression,
      encryption: bucketConfig.encryption,
      antivirus: bucketConfig.antivirus,
      transformations: bucketConfig.transformations,
    },
    expectedStatuses: [201],
  });
}

async function listAttributes(collectionId) {
  const payload = await appwriteRequest(
    `/databases/${env.databaseId}/collections/${collectionId}/attributes`,
    {
      method: "GET",
      expectedStatuses: [200],
    },
  );

  return payload.attributes ?? [];
}

async function listIndexes(collectionId) {
  const payload = await appwriteRequest(
    `/databases/${env.databaseId}/collections/${collectionId}/indexes`,
    {
      method: "GET",
      expectedStatuses: [200],
    },
  );

  return payload.indexes ?? [];
}

async function waitForAttribute(collectionId, key) {
  await waitForStatus({
    label: `attribute ${collectionId}.${key}`,
    load: async () => {
      const attributes = await listAttributes(collectionId);
      return attributes.find((attribute) => attribute.key === key) ?? null;
    },
  });
}

async function waitForIndex(collectionId, key) {
  await waitForStatus({
    label: `index ${collectionId}.${key}`,
    load: async () => {
      const indexes = await listIndexes(collectionId);
      return indexes.find((index) => index.key === key) ?? null;
    },
  });
}

async function waitForStatus({ label, load }) {
  const timeoutMs = 60_000;
  const intervalMs = 1_500;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const resource = await load();
    const status = String(resource?.status ?? "").toLowerCase();

    if (status === "available" || status === "enabled" || status === "ready") {
      return;
    }

    if (status === "failed" || status === "stuck") {
      throw new Error(`${label} entered a failed state.`);
    }

    await delay(intervalMs);
  }

  throw new Error(`Timed out while waiting for ${label} to finish.`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
