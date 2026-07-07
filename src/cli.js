#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportBundle, importBundle, stableStringify } from "./core.js";
import { generateReceipt, verifyRoundTrip } from "./portability.js";
import { createServer } from "./server.js";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(sourceDir, "..");
const dataDir = path.resolve(process.env.NPT_DATA_DIR || path.join(projectRoot, ".data"));
const [command = "help", argument] = process.argv.slice(2);

async function main() {
  if (command === "serve") {
    const port = Number(process.env.PORT || 8080);
    const server = createServer(dataDir);
    server.listen(port, "127.0.0.1", () => {
      process.stdout.write(`NEX-Portability Test listening on http://127.0.0.1:${port}\n`);
    });
    return;
  }

  if (command === "export") {
    const output = `${stableStringify(await exportBundle(dataDir))}\n`;
    if (argument) await writeFile(path.resolve(argument), output, "utf8");
    else process.stdout.write(output);
    return;
  }

  if (command === "import") {
    if (!argument) throw new Error("usage: npt import <bundle.json>");
    await importBundle(dataDir, JSON.parse(await readFile(path.resolve(argument), "utf8")));
    process.stdout.write("bundle imported\n");
    return;
  }

  if (command === "verify") {
    const result = await verifyRoundTrip(dataDir);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.roundTripEqual || !result.deterministicExport) process.exitCode = 1;
    return;
  }

  if (command === "receipt") {
    const receipt = await generateReceipt(dataDir, projectRoot);
    const output = `${stableStringify(receipt)}\n`;
    if (argument) await writeFile(path.resolve(argument), output, "utf8");
    else process.stdout.write(output);
    return;
  }

  process.stdout.write("usage: npt <serve|export [file]|import file|verify|receipt [file]>\n");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
