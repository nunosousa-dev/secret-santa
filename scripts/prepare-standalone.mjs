import { cpSync, existsSync } from "node:fs";

// Next's standalone output needs its static assets alongside the server.
if (!existsSync(".next/standalone/server.js")) {
  throw new Error("Standalone server missing. Run next build first.");
}
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
if (existsSync("public")) {
  cpSync("public", ".next/standalone/public", { recursive: true });
}
