import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
// Standalone changes cwd; resolve persistent data relative to the project first.
process.env.DATABASE_PATH = resolve(process.env.DATABASE_PATH || "data/family.sqlite");
await import("../.next/standalone/server.js");
