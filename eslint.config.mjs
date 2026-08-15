import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/await-thenable": "off",
      "obsidianmd/ui/sentence-case": [
        "error",
        { enforceCamelCaseLower: true, allowAutoFix: true },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "main.js",
      "src/toolAssets.ts",
      "tools/**",
      "docs/**",
      "zotero-companion/**",
    ],
  },
]);
