const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 5173);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const RESUME_FILE = path.join(DATA_DIR, "resume.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("Payload too large");
    }
  }

  return body ? JSON.parse(body) : {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function handleApi(request, response) {
  if (request.url === "/api/resume" && request.method === "GET") {
    try {
      const content = await fs.readFile(RESUME_FILE, "utf8");
      sendJson(response, 200, JSON.parse(content));
    } catch (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 200, { data: null, savedAt: null });
        return;
      }

      throw error;
    }
    return;
  }

  if (request.url === "/api/resume" && request.method === "POST") {
    const payload = await readJsonBody(request);
    const filePayload = {
      savedAt: new Date().toISOString(),
      data: payload.data || {}
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(RESUME_FILE, JSON.stringify(filePayload, null, 2), "utf8");
    sendJson(response, 200, { ok: true, savedAt: filePayload.savedAt });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Resume editor running at http://localhost:${PORT}`);
});
