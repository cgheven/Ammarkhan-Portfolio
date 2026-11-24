import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"
const root = fileURLToPath(new URL(".", import.meta.url))
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" }
const port = process.env.PORT || 3000
createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"
  const file = normalize(join(root, p))
  if (!file.startsWith(root)) { res.writeHead(403).end(); return }
  try { const b = await readFile(file); res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }).end(b) }
  catch { res.writeHead(404).end("Not found") }
}).listen(port, () => console.log(`Portfolio running at http://localhost:${port}`))
