import { resolve } from "node:path";
import { getStore } from "../src/lib/db/store";
import { loadLocalEnv } from "./env";

loadLocalEnv();
const store = getStore();
try {
  const command = process.argv[2];
  if (command === "seed") console.log(store.seedSamples() ? "Perfis fictícios criados." : "A base de dados já tem perfis; nenhum foi alterado.");
  else if (command === "migrate") console.log("Migrações aplicadas.");
  else if (command === "backup") {
    const destination = resolve(process.argv[3] || `data/backups/family-${Date.now()}.sqlite`);
    const { mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(destination), { recursive: true });
    await store.sqlite.backup(destination);
    console.log("Backup consistente criado.");
  } else throw new Error("Usa migrate, seed ou backup.");
} finally { store.close(); }
