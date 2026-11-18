import { createServer } from "vite";
import process from "node:process";
import console from "node:console";
import { resolve, relative, isAbsolute } from "node:path";

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--out" || !args[1])
  throw new Error(
    "Usage: node scripts/run-metrics-audit.mjs --out <candidate-directory>",
  );
const out = resolve(args[1]);
const scratch = resolve(".superpowers/sdd/2026-11-07-phase-1c-1-facts-metrics");
const inside = relative(scratch, out);
if (!inside || inside.startsWith("..") || isAbsolute(inside))
  throw new Error(
    "Output must be a candidate subdirectory of the 1C.1 scratch workspace; audited goldens cannot be overwritten.",
  );
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { writeCorpusAudit } = await server.ssrLoadModule(
    "/scripts/audit-poker-metrics.ts",
  );
  writeCorpusAudit(out);
  console.log(`Candidate counts and audit rows written to ${out}`);
} finally {
  await server.close();
}
