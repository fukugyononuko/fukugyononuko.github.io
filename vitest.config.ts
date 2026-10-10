import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/{unit,integration,architecture}/**/*.test.ts"],
    exclude: ["tests/architecture/fixtures/**"],
  },
});
