import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const temp = await mkdtemp(join(tmpdir(), "kidbridge-racing-"));
try {
  for (const entry of ["engine", "pin"])
    await build({
      entryPoints: [`src/utils/racing/${entry}.ts`],
      outfile: join(temp, `${entry}.cjs`),
      bundle: true,
      platform: "node",
      format: "cjs",
      logLevel: "silent",
    });
  const result = spawnSync(
    process.execPath,
    ["--test", "tests/racing/engine.test.cjs"],
    { stdio: "inherit", env: { ...process.env, RACING_TEST_DIR: temp } },
  );
  process.exitCode = result.status ?? 1;
} finally {
  await rm(temp, { recursive: true, force: true });
}
