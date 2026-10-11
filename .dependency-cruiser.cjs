// DD-12 依存規則の検査（01 §1.6 R1〜R7、NFR-09、TC-A01）
// 構成要素は 1 ファイルでも、同名のディレクトリ（例：resource-access/content-access/）でもよい。同じ構成要素の中の import は許可する。
// dependency-cruiser は .astro を解析できないため、.astro の import は scripts/check-astro-imports.mjs で同じ規則を検査する。
const CLIENT = "^src/(pages|layouts|components|scripts|styles)/";

/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "R1-client-only-calls-managers",
      comment: "Client が import してよいのは src/system/compose.ts と src/system/contracts/ だけ。コンテンツも直接読まない",
      severity: "error",
      from: { path: CLIENT },
      to: { path: ["^src/system/", "^src/content/", "^src/content\\.config\\.ts$", "^astro:content$"], pathNot: ["^src/system/compose\\.ts$", "^src/system/contracts/"] },
    },
    {
      name: "R3-no-manager-to-manager",
      severity: "error",
      from: { path: "^src/system/managers/([^/.]+)" },
      to: { path: "^src/system/managers/", pathNot: "^src/system/managers/$1([./]|$)" },
    },
    {
      name: "R4-engine-calls-down-only",
      comment: "Engine から Engine と Manager は呼ばない",
      severity: "error",
      from: { path: "^src/system/engines/([^/.]+)" },
      to: { path: ["^src/system/engines/", "^src/system/managers/"], pathNot: "^src/system/engines/$1([./]|$)" },
    },
    {
      name: "R5-resource-access-isolated",
      comment: "ResourceAccess から ResourceAccess、Engine、Manager は呼ばない",
      severity: "error",
      from: { path: "^src/system/resource-access/([^/.]+)" },
      to: { path: ["^src/system/resource-access/", "^src/system/engines/", "^src/system/managers/"], pathNot: "^src/system/resource-access/$1([./]|$)" },
    },
    {
      name: "R7-utility-calls-nothing-above",
      severity: "error",
      from: { path: "^src/system/utilities/" },
      to: { path: "^src/system/(managers|engines|resource-access)/" },
    },
    {
      name: "R6-system-does-not-call-clients",
      severity: "error",
      from: { path: "^src/system/" },
      to: { path: CLIENT },
    },
    {
      name: "contracts-are-types-only",
      comment: "contracts/ は他の層に依存しない（R9）",
      severity: "error",
      from: { path: "^src/system/contracts/" },
      to: { path: "^src/", pathNot: "^src/system/contracts/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^(dist|\\.astro)/" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { extensions: [".ts", ".mjs", ".js"] },
  },
};
