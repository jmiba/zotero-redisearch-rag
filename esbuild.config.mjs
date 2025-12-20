import esbuild from "esbuild";
import { builtinModules } from "module";
import process from "process";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outdir: ".",
  sourcemap: prod ? false : "inline",
  minify: prod,
  platform: "node",
  target: "es2018",
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    ...builtinModules,
  ],
});

if (prod) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
