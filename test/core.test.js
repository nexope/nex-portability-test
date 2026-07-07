import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  APP_ID,
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  exportBundle,
  importBundle,
  stableStringify,
  upsertRecord
} from "../src/core.js";
import { generateReceipt, verifyRoundTrip } from "../src/portability.js";

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "npt-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("exports records deterministically", async (t) => {
  const directory = await temporaryDirectory(t);
  await upsertRecord(directory, { id: "z", value: "last" });
  await upsertRecord(directory, { id: "a", value: "first" });
  const first = stableStringify(await exportBundle(directory));
  const second = stableStringify(await exportBundle(directory));
  assert.equal(first, second);
  assert.deepEqual((await exportBundle(directory)).records.map(({ id }) => id), ["a", "z"]);
});

test("round trip preserves canonical state", async (t) => {
  const source = await temporaryDirectory(t);
  const target = await temporaryDirectory(t);
  await upsertRecord(source, { id: "one", value: "portable" });
  const bundle = await exportBundle(source);
  await importBundle(target, bundle);
  assert.equal(stableStringify(await exportBundle(source)), stableStringify(await exportBundle(target)));
  assert.equal((await verifyRoundTrip(source)).roundTripEqual, true);
});

test("rejects unknown or secret-like fields", async (t) => {
  const directory = await temporaryDirectory(t);
  await assert.rejects(
    importBundle(directory, {
      format: BUNDLE_FORMAT,
      records: [{ id: "one", password: "do-not-export", value: "x" }],
      schemaVersion: BUNDLE_VERSION,
      service: APP_ID
    }),
    /only id and value/
  );
});

test("rejects unsupported schemas", async (t) => {
  const directory = await temporaryDirectory(t);
  await assert.rejects(
    importBundle(directory, {
      format: BUNDLE_FORMAT,
      records: [],
      schemaVersion: "99",
      service: APP_ID
    }),
    /unsupported bundle/
  );
});

test("receipt binds deployment files and portable state", async (t) => {
  const directory = await temporaryDirectory(t);
  await upsertRecord(directory, { id: "proof", value: "verified" });
  const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
  const receipt = await generateReceipt(directory, projectRoot);
  assert.equal(receipt.verification.roundTripEqual, true);
  assert.match(receipt.verification.bundleSha256, /^[a-f0-9]{64}$/);
  assert.match(receipt.deploymentFiles["flake.nix"], /^[a-f0-9]{64}$/);
});

test("state file is valid canonical JSON", async (t) => {
  const directory = await temporaryDirectory(t);
  await upsertRecord(directory, { id: "b", value: "2" });
  await upsertRecord(directory, { id: "a", value: "1" });
  const raw = await readFile(path.join(directory, "state.json"), "utf8");
  assert.equal(raw, `${stableStringify(JSON.parse(raw))}\n`);
});
