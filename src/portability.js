import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { canonicalBundle, exportBundle, importBundle, sha256, stableStringify } from "./core.js";

export const RECEIPT_FORMAT = "npt-portability-receipt";
export const RECEIPT_VERSION = "1.0";

const deploymentFiles = [
  "flake.nix",
  "nix/module.nix",
  "package.json",
  "schema/portability-receipt.schema.json",
  "schema/portable-state.schema.json",
  "src/cli.js",
  "src/core.js",
  "src/portability.js",
  "src/server.js"
];

async function hashDeploymentFiles(projectRoot) {
  const hashes = {};
  for (const relative of deploymentFiles) {
    hashes[relative] = sha256(await readFile(path.join(projectRoot, relative), "utf8"));
  }
  return hashes;
}

export async function verifyRoundTrip(dataDir) {
  const source = canonicalBundle(await exportBundle(dataDir));
  const temporary = await mkdtemp(path.join(os.tmpdir(), "npt-portability-"));
  try {
    await importBundle(temporary, source);
    const restored = canonicalBundle(await exportBundle(temporary));
    const sourceCanonical = stableStringify(source);
    const restoredCanonical = stableStringify(restored);
    return {
      bundleSha256: sha256(sourceCanonical),
      deterministicExport: sourceCanonical === stableStringify(canonicalBundle(source)),
      roundTripEqual: sourceCanonical === restoredCanonical,
      schemaValidated: true
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function generateReceipt(dataDir, projectRoot) {
  const verification = await verifyRoundTrip(dataDir);
  return {
    deploymentFiles: await hashDeploymentFiles(projectRoot),
    format: RECEIPT_FORMAT,
    service: "org.nexope.nex-portability-test.reference-service",
    verification,
    version: RECEIPT_VERSION
  };
}
