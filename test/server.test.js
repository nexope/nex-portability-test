import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createServer } from "../src/server.js";

test("reference service exposes portable state", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "npt-server-"));
  const server = createServer(directory);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  assert.equal((await fetch(`${base}/health`)).status, 200);
  const create = await fetch(`${base}/api/records`, {
    body: JSON.stringify({ id: "demo", value: "portable" }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  assert.equal(create.status, 201);
  const state = await (await fetch(`${base}/api/records`)).json();
  assert.deepEqual(state.records, [{ id: "demo", value: "portable" }]);
});
