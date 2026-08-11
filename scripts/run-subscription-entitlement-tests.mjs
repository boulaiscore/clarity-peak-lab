import { build } from "esbuild";

const result = await build({
  entryPoints: ["scripts/subscription-entitlement-tests.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  tsconfig: "tsconfig.json",
  logLevel: "silent",
});

const source = result.outputFiles[0].text;
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
