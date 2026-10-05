import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  globalIgnores([".next/**", "drizzle/**", ".data/**", "coverage/**"]),
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // CLI scripts print to the terminal by design.
    files: ["src/db/migrate.ts", "scripts/**"],
    rules: { "no-console": "off" },
  },
]);
