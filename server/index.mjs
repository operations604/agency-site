// Coolify start command: `node server/index.mjs`
// One process: the built site + GET /availability + POST /bookings.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createBooking, getAvailability } from "./booking.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = join(root, "dist");
const port = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 80_000) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function safeDistPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const resolved = normalize(join(dist, relative));
  if (!resolved.startsWith(dist + sep) && resolved !== dist) return null;
  return resolved;
}

async function serveStatic(urlPath, res) {
  const file = safeDistPath(urlPath);
  if (!file) {
    res.writeHead(400);
    res.end("Bad path");
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    if (extname(urlPath.split("?")[0])) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    try {
      const index = await readFile(join(dist, "index.html"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(index);
    } catch {
      res.writeHead(503);
      res.end("Site build missing");
    }
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (req.method === "GET" && path === "/health") {
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && path === "/availability") {
      const result = await getAvailability(
        url.searchParams.get("from") || "",
        url.searchParams.get("to") || "",
        url.searchParams.get("timezone") || "",
      );
      json(res, 200, result);
      return;
    }

    if (req.method === "POST" && path === "/bookings") {
      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        json(res, 400, { ok: false, code: "invalid", message: "Body was not JSON." });
        return;
      }
      const result = await createBooking(body);
      json(res, result.status, result.body);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(url.pathname, res);
      return;
    }

    json(res, 405, { ok: false, code: "invalid", message: "Method not allowed." });
  } catch (err) {
    const status = err.status || 500;
    if (status === 400) {
      json(res, 400, { ok: false, code: "invalid", message: err.message });
      return;
    }
    console.error(err);
    json(res, 500, {
      ok: false,
      code: "server_error",
      message: "Something broke on our side. Nothing was booked.",
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Applied Systems listening on ${port}`);
});
