import { randomUUID } from "node:crypto";
import {
  APPWRITE_COLLECTION_IDS,
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_STORAGE_BUCKET_ID,
} from "@/lib/appwrite/constants";
import { getEnv } from "@/lib/config";

type AppwriteCollectionName = "vpes" | "evaluators" | "invitations";

type BackendFilterCondition = {
  field: string;
  value: string;
};

export type BackendFilter = {
  conditions: BackendFilterCondition[];
};

type ListOptions = {
  expand?: string;
  filter?: BackendFilter;
  sort?: string;
};

type FirstListOptions = {
  expand?: string;
};

type AppwriteDocument = Record<string, unknown> & {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
};

type AppwriteFile = {
  $id: string;
  name?: string;
};

type BackendCollectionClient = {
  getFirstListItem<T>(filter: BackendFilter, options?: FirstListOptions): Promise<T>;
  getOne<T>(id: string): Promise<T>;
  getFullList<T>(options?: ListOptions): Promise<T[]>;
  create<T>(data: Record<string, unknown>): Promise<T>;
  update<T>(id: string, data: Record<string, unknown>): Promise<T>;
  delete(id: string): Promise<void>;
};

export type BackendClient = {
  collection(name: AppwriteCollectionName): BackendCollectionClient;
  filter(template: string, params: Record<string, string>): BackendFilter;
  files: {
    getURL(record: unknown, fileId: string): string;
    getInfo(fileId: string): Promise<AppwriteFile>;
  };
};

type AppwriteEnv = ReturnType<typeof getEnv>;

class BackendRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
  }
}

function getCollectionId(env: AppwriteEnv, name: AppwriteCollectionName) {
  if (name === "vpes") {
    return APPWRITE_COLLECTION_IDS.vpes;
  }

  if (name === "evaluators") {
    return APPWRITE_COLLECTION_IDS.evaluators;
  }

  return APPWRITE_COLLECTION_IDS.invitations;
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
}

function createAppwriteHeaders(env: AppwriteEnv, contentType = "application/json") {
  return {
    "Content-Type": contentType,
    "X-Appwrite-Key": env.APPWRITE_API_KEY,
    "X-Appwrite-Project": env.APPWRITE_PROJECT_ID,
    "X-Appwrite-Response-Format": "1.9.5",
  };
}

function createUrl(env: AppwriteEnv, path: string) {
  return new URL(path.replace(/^\/+/, ""), normalizeEndpoint(APPWRITE_ENDPOINT));
}

async function parseErrorResponse(response: Response) {
  try {
    const payload = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }
  } catch {
    // Ignore JSON parsing failures and fall back to status text.
  }

  return response.statusText || "The backend request failed.";
}

async function requestJson<T>(
  env: AppwriteEnv,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(createUrl(env, path), {
    ...init,
    headers: {
      ...createAppwriteHeaders(env),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new BackendRequestError(await parseErrorResponse(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function requestWithoutJson(
  env: AppwriteEnv,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(createUrl(env, path), {
    ...init,
    headers: {
      ...createAppwriteHeaders(env, "application/json"),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new BackendRequestError(await parseErrorResponse(response), response.status);
  }
}

function createQueryEqual(field: string, value: string) {
  return JSON.stringify({
    method: "equal",
    attribute: field,
    values: [value],
  });
}

function createSortQuery(sort: string) {
  const isDescending = sort.startsWith("-");
  const rawField = isDescending ? sort.slice(1) : sort;
  const appwriteField =
    rawField === "created"
      ? "$createdAt"
      : rawField === "updated"
        ? "$updatedAt"
        : rawField;

  return JSON.stringify({
    method: isDescending ? "orderDesc" : "orderAsc",
    attribute: appwriteField,
  });
}

function createLimitQuery(limit: number) {
  return JSON.stringify({
    method: "limit",
    values: [limit],
  });
}

function createListQueries(filter?: BackendFilter, sort?: string, limit = 5000) {
  const queries = (filter?.conditions ?? []).map((condition) =>
    createQueryEqual(condition.field, condition.value),
  );

  if (sort) {
    queries.push(createSortQuery(sort));
  }

  queries.push(createLimitQuery(limit));

  return queries;
}

function mapDocument<T>(collectionName: AppwriteCollectionName, collectionId: string, document: AppwriteDocument) {
  return {
    ...document,
    id: document.$id,
    collectionId,
    collectionName,
    created: document.$createdAt ?? "",
    updated: document.$updatedAt ?? "",
  } as T;
}

function parseTemplateCondition(template: string) {
  const match = template.trim().match(/^([a-zA-Z0-9_$]+)\s*=\s*\{:(\w+)\}$/);

  if (!match) {
    throw new Error(`Unsupported backend filter: ${template}`);
  }

  return {
    field: match[1],
    paramKey: match[2],
  };
}

async function uploadEvaluatorPhoto(env: AppwriteEnv, file: File) {
  const formData = new FormData();
  formData.append("fileId", randomUUID());
  formData.append("file", file, file.name);
  formData.append("permissions[]", "read(\"any\")");

  const response = await fetch(
    createUrl(env, `/storage/buckets/${APPWRITE_STORAGE_BUCKET_ID}/files`),
    {
      method: "POST",
      headers: {
        "X-Appwrite-Key": env.APPWRITE_API_KEY,
        "X-Appwrite-Project": env.APPWRITE_PROJECT_ID,
        "X-Appwrite-Response-Format": "1.9.5",
      },
      body: formData,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new BackendRequestError(await parseErrorResponse(response), response.status);
  }

  return response.json() as Promise<AppwriteFile>;
}

async function prepareDocumentData(
  env: AppwriteEnv,
  collectionName: AppwriteCollectionName,
  data: Record<string, unknown>,
) {
  if (collectionName !== "evaluators") {
    return data;
  }

  const photo = data.photo;

  if (!(photo instanceof File)) {
    return data;
  }

  const uploadedPhoto = await uploadEvaluatorPhoto(env, photo);

  return {
    ...data,
    photo: uploadedPhoto.$id,
  };
}

async function expandEvaluatorReference(
  env: AppwriteEnv,
  document: AppwriteDocument,
) {
  const evaluatorId = typeof document.evaluator === "string" ? document.evaluator : "";

  if (!evaluatorId) {
    return document;
  }

  try {
    const evaluatorDocument = await requestJson<AppwriteDocument>(
      env,
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_COLLECTION_IDS.evaluators}/documents/${evaluatorId}`,
      {
        method: "GET",
      },
    );

    return {
      ...document,
      expand: {
        evaluator: mapDocument("evaluators", APPWRITE_COLLECTION_IDS.evaluators, evaluatorDocument),
      },
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return document;
    }

    throw error;
  }
}

async function expandVpeReference(
  env: AppwriteEnv,
  document: AppwriteDocument,
) {
  const vpeId = typeof document.vpe === "string" ? document.vpe : "";

  if (!vpeId) {
    return document;
  }

  try {
    const vpeDocument = await requestJson<AppwriteDocument>(
      env,
      `/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_COLLECTION_IDS.vpes}/documents/${vpeId}`,
      {
        method: "GET",
      },
    );

    return {
      ...document,
      expand: {
        ...(typeof document.expand === "object" && document.expand !== null ? document.expand : {}),
        vpe: mapDocument("vpes", APPWRITE_COLLECTION_IDS.vpes, vpeDocument),
      },
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return document;
    }

    throw error;
  }
}

async function expandDocument(
  env: AppwriteEnv,
  collectionName: AppwriteCollectionName,
  document: AppwriteDocument,
  expand?: string,
) {
  if (collectionName === "invitations" && expand) {
    const expandTargets = expand
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    let expandedDocument = document;

    if (expandTargets.includes("evaluator")) {
      expandedDocument = await expandEvaluatorReference(env, expandedDocument);
    }

    if (expandTargets.includes("vpe")) {
      expandedDocument = await expandVpeReference(env, expandedDocument);
    }

    return expandedDocument;
  }

  return document;
}

function createCollectionClient(
  env: AppwriteEnv,
  collectionName: AppwriteCollectionName,
): BackendCollectionClient {
  const collectionId = getCollectionId(env, collectionName);
  const collectionPath = `/databases/${APPWRITE_DATABASE_ID}/collections/${collectionId}/documents`;

  return {
    async getFirstListItem<T>(filter: BackendFilter, options?: FirstListOptions) {
      const url = createUrl(env, collectionPath);

      for (const query of createListQueries(filter, undefined, 1)) {
        url.searchParams.append("queries[]", query);
      }

      const payload = await requestJson<{ documents?: AppwriteDocument[] }>(env, `${collectionPath}?${url.searchParams.toString()}`, {
        method: "GET",
      });
      const document = payload.documents?.[0];

      if (!document) {
        throw new BackendRequestError("The requested record was not found.", 404);
      }

      const expanded = await expandDocument(env, collectionName, document, options?.expand);

      return mapDocument<T>(collectionName, collectionId, expanded);
    },
    async getOne<T>(id: string) {
      const document = await requestJson<AppwriteDocument>(
        env,
        `${collectionPath}/${id}`,
        { method: "GET" },
      );

      return mapDocument<T>(collectionName, collectionId, document);
    },
    async getFullList<T>(options?: ListOptions) {
      const url = createUrl(env, collectionPath);

      for (const query of createListQueries(options?.filter, options?.sort)) {
        url.searchParams.append("queries[]", query);
      }

      const payload = await requestJson<{ documents?: AppwriteDocument[] }>(
        env,
        `${collectionPath}?${url.searchParams.toString()}`,
        { method: "GET" },
      );
      const documents = payload.documents ?? [];
      const expandedDocuments = await Promise.all(
        documents.map((document) => expandDocument(env, collectionName, document, options?.expand)),
      );

      return expandedDocuments.map((document) =>
        mapDocument<T>(collectionName, collectionId, document),
      );
    },
    async create<T>(data: Record<string, unknown>) {
      const preparedData = await prepareDocumentData(env, collectionName, data);
      const document = await requestJson<AppwriteDocument>(
        env,
        collectionPath,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: randomUUID(),
            data: preparedData,
          }),
        },
      );

      return mapDocument<T>(collectionName, collectionId, document);
    },
    async update<T>(id: string, data: Record<string, unknown>) {
      const preparedData = await prepareDocumentData(env, collectionName, data);
      const document = await requestJson<AppwriteDocument>(
        env,
        `${collectionPath}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            data: preparedData,
          }),
        },
      );

      return mapDocument<T>(collectionName, collectionId, document);
    },
    async delete(id: string) {
      await requestWithoutJson(env, `${collectionPath}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

function createPublicFileUrl(env: AppwriteEnv, fileId: string) {
  const url = createUrl(env, `/storage/buckets/${APPWRITE_STORAGE_BUCKET_ID}/files/${fileId}/view`);
  url.searchParams.set("project", env.APPWRITE_PROJECT_ID);

  return url.toString();
}

export function createAppwriteClient(): BackendClient {
  const env = getEnv();

  return {
    collection(name: AppwriteCollectionName) {
      return createCollectionClient(env, name);
    },
    filter(template: string, params: Record<string, string>) {
      return {
        conditions: template
          .split("&&")
          .map((condition) => condition.trim())
          .filter(Boolean)
          .map((condition) => {
            const parsed = parseTemplateCondition(condition);
            const value = params[parsed.paramKey];

            if (typeof value !== "string") {
              throw new Error(`Missing backend filter param: ${parsed.paramKey}`);
            }

            return {
              field: parsed.field,
              value,
            };
          }),
      };
    },
    files: {
      getURL(_record: unknown, fileId: string) {
        return createPublicFileUrl(env, fileId);
      },
      getInfo(fileId: string) {
        return requestJson<AppwriteFile>(
          env,
          `/storage/buckets/${APPWRITE_STORAGE_BUCKET_ID}/files/${fileId}`,
          {
            method: "GET",
          },
        );
      },
    },
  };
}

export async function getAppwriteAdmin() {
  return createAppwriteClient();
}
