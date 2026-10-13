import { resolve } from "node:path";
import { getStore } from "../src/lib/db/store";
import { loadLocalEnv } from "./env";

loadLocalEnv();
const store = getStore();
try {
  const command = process.argv[2];
  if (command === "seed") console.log(store.seedSamples() ? "Fictional profiles created." : "The database already contains profiles; none were changed.");
  else if (command === "migrate") console.log("Migrations applied.");
  else if (command === "backup") {
    const destination = resolve(process.argv[3] || `data/backups/family-${Date.now()}.sqlite`);
    const { mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(destination), { recursive: true });
    await store.sqlite.backup(destination);
    console.log("Consistent backup created.");
  } else throw new Error("Use migrate, seed or backup.");
} finally { store.close(); }
