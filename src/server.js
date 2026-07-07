import { createServer as createHttpServer } from "node:http";
import { readState, upsertRecord } from "./core.js";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function send(response, status, body) {
  response.writeHead(status, jsonHeaders);
  response.end(`${JSON.stringify(body)}\n`);
}

async function readJson(request, maxBytes = 16_384) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("request body too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createServer(dataDir) {
  return createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return send(response, 200, { status: "ok" });
      }
      if (request.method === "GET" && url.pathname === "/api/records") {
        return send(response, 200, await readState(dataDir));
      }
      if (request.method === "POST" && url.pathname === "/api/records") {
        const state = await upsertRecord(dataDir, await readJson(request));
        return send(response, 201, state);
      }
      return send(response, 404, { error: "not found" });
    } catch (error) {
      return send(response, 400, { error: error.message });
    }
  });
}
