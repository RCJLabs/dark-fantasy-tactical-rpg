import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const out = join(root, "dist-pages");
const origin = "https://ashmark.rcjlabs.com";

const built = spawnSync("node", ["scripts/with-app-env.mjs", "node_modules/vite/bin/vite.js", "build"], {
  cwd: root,
  env: { ...process.env, PAGES: "1" },
  stdio: "inherit",
});
if (built.status !== 0) process.exit(built.status ?? 1);

function findClient() {
  const candidates = [join(root, "dist", "client"), join(root, "dist"), join(root, ".output", "public")];
  for (const dir of candidates) {
    try {
      const names = readdirSync(dir);
      if (names.includes("index.html") || names.includes("_shell.html")) return dir;
    } catch {
      /* missing */
    }
  }
  return null;
}

const client = findClient();
if (!client) {
  console.error("pages build produced no index.html");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
function exists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

cpSync(client, out, { recursive: true });
const shell = join(out, "_shell.html");
const index = join(out, "index.html");
if (!exists(index) && exists(shell)) cpSync(shell, index);

function walk(dir, visit) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, visit);
    else visit(path);
  }
}

walk(out, (path) => {
  if (!/\.(html|css|js|webmanifest)$/.test(path)) return;
  const text = readFileSync(path, "utf8");
  const next = text
    .replaceAll('href="/__grok/manifest.webmanifest"', 'href="/manifest.json"')
    .replaceAll('href="/favicon.svg"', 'href="/favicon.svg"')
    .replaceAll('href="/__grok/icon-180.png"', 'href="/art/icon-192.png"');
  if (next !== text) writeFileSync(path, next);
});

const manifest = JSON.stringify(
  {
    name: "Ashmark",
    short_name: "Ashmark",
    id: `${origin}/`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#100d0b",
    theme_color: "#100d0b",
    icons: [
      { src: "/art/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/art/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/art/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  null,
  2,
);
writeFileSync(join(out, "manifest.json"), manifest);
writeFileSync(join(out, "CNAME"), "ashmark.rcjlabs.com\n");
writeFileSync(join(out, ".nojekyll"), "");

cpSync(join(out, "index.html"), join(out, "404.html"));
console.log("pages site written to", out);
