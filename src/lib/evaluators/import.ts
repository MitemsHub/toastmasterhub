import { createEvaluatorProfileFromInput, DuplicateEvaluatorError } from "@/lib/evaluators/service";
import type { BackendClient } from "@/lib/appwrite/client";
import { Buffer } from "node:buffer";
import { normalizePhoneNumber } from "@/lib/evaluators/phone";

type EvaluatorImportClient = Pick<BackendClient, "collection" | "filter">;

type EvaluatorImportSummary = {
  createdCount: number;
  skippedDuplicateCount: number;
};

type CsvEvaluatorRow = {
  fullName: string;
  email: string;
  phone: string;
  profile: string;
};

const REQUIRED_HEADERS = ["fullName", "email", "phone", "profile"] as const;

export class EvaluatorImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluatorImportError";
  }
}

function parseCsvRow(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseEvaluatorRows(csvContent: string) {
  const lines = csvContent
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new EvaluatorImportError("Upload a CSV file with at least one evaluator row.");
  }

  const headers = parseCsvRow(lines[0]);

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new EvaluatorImportError(
        `The CSV template must include: ${REQUIRED_HEADERS.join(", ")}.`,
      );
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvRow(line);
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""]));

    return {
      fullName: String(row.fullName ?? "").trim(),
      email: String(row.email ?? "").trim(),
      phone: normalizePhoneNumber(String(row.phone ?? "")),
      profile: String(row.profile ?? "").trim(),
      rowNumber: index + 2,
    };
  });
}

const GENERATED_AVATAR_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sWwaP8AAAAASUVORK5CYII=";

function createGeneratedAvatarFile(_fullName: string, rowNumber: number) {
  const photoBytes = Buffer.from(GENERATED_AVATAR_PNG_BASE64, "base64");

  return new File([photoBytes], `evaluator-${rowNumber}.png`, {
    type: "image/png",
  });
}

export async function importEvaluatorsFromCsv(
  pb: EvaluatorImportClient,
  csvFile: File,
  vpeId: string,
): Promise<EvaluatorImportSummary> {
  if (!(csvFile instanceof File) || !csvFile.name) {
    throw new EvaluatorImportError("Select a CSV file before uploading.");
  }

  const csvContent = await csvFile.text();
  const rows = parseEvaluatorRows(csvContent);
  let createdCount = 0;
  let skippedDuplicateCount = 0;

  for (const row of rows) {
    if (!row.fullName || !row.email || !row.phone || !row.profile) {
      throw new EvaluatorImportError(
        `Complete all evaluator columns before uploading. Check row ${row.rowNumber}.`,
      );
    }

    const photo = createGeneratedAvatarFile(row.fullName, row.rowNumber);

    try {
      await createEvaluatorProfileFromInput(
        pb,
        {
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          profile: row.profile,
          photo,
        },
        vpeId,
      );
      createdCount += 1;
    } catch (error) {
      if (error instanceof DuplicateEvaluatorError) {
        skippedDuplicateCount += 1;
        continue;
      }

      throw error;
    }
  }

  return {
    createdCount,
    skippedDuplicateCount,
  };
}
