import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const APP_ID = "org.nexope.nex-portability-test.reference-service";
export const BUNDLE_FORMAT = "npt-portable-state";
export const BUNDLE_VERSION = "1.0";

const stateFilename = "state.json";

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertText(value, label, maxLength) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new Error(`${label} must be a non-empty string of at most ${maxLength} characters`);
  }
}

export function canonicalRecords(records) {
  if (!Array.isArray(records)) {
    throw new Error("records must be an array");
  }

  const seen = new Set();
  return records
    .map((record) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error("each record must be an object");
      }
      const keys = Object.keys(record).sort();
      if (stableStringify(keys) !== stableStringify(["id", "value"])) {
        throw new Error("records may contain only id and value");
      }
      assertText(record.id, "record.id", 80);
      assertText(record.value, "record.value", 2000);
      if (seen.has(record.id)) {
        throw new Error(`duplicate record id: ${record.id}`);
      }
      seen.add(record.id);
      return { id: record.id, value: record.value };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function canonicalBundle(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("bundle must be an object");
  }
  if (input.format !== BUNDLE_FORMAT || input.schemaVersion !== BUNDLE_VERSION) {
    throw new Error("unsupported bundle format or schemaVersion");
  }
  if (input.service !== APP_ID) {
    throw new Error("bundle belongs to a different service");
  }
  return {
    format: BUNDLE_FORMAT,
    records: canonicalRecords(input.records),
    schemaVersion: BUNDLE_VERSION,
    service: APP_ID
  };
}

export function emptyState() {
  return { records: [], schemaVersion: BUNDLE_VERSION };
}

export async function readState(dataDir) {
  try {
    const parsed = JSON.parse(await readFile(path.join(dataDir, stateFilename), "utf8"));
    if (parsed.schemaVersion !== BUNDLE_VERSION) {
      throw new Error("unsupported state schemaVersion");
    }
    return { records: canonicalRecords(parsed.records), schemaVersion: BUNDLE_VERSION };
  } catch (error) {
    if (error.code === "ENOENT") return emptyState();
    throw error;
  }
}

export async function writeState(dataDir, state) {
  const canonical = {
    records: canonicalRecords(state.records),
    schemaVersion: BUNDLE_VERSION
  };
  await mkdir(dataDir, { recursive: true });
  const target = path.join(dataDir, stateFilename);
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, `${stableStringify(canonical)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  return canonical;
}

export async function exportBundle(dataDir) {
  const state = await readState(dataDir);
  return canonicalBundle({
    format: BUNDLE_FORMAT,
    records: state.records,
    schemaVersion: BUNDLE_VERSION,
    service: APP_ID
  });
}

export async function importBundle(dataDir, bundle) {
  const canonical = canonicalBundle(bundle);
  return writeState(dataDir, {
    records: canonical.records,
    schemaVersion: BUNDLE_VERSION
  });
}

export async function upsertRecord(dataDir, record) {
  const validated = canonicalRecords([record])[0];
  const state = await readState(dataDir);
  const records = state.records.filter((entry) => entry.id !== validated.id);
  records.push(validated);
  return writeState(dataDir, { records, schemaVersion: BUNDLE_VERSION });
}
