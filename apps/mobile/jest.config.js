const workspacePackages = {
  "^@nidoru/domain$": "<rootDir>/../../packages/domain/src/index.ts",
  "^@nidoru/i18n$": "<rootDir>/../../packages/i18n/src/index.ts",
  "^@nidoru/ui-tokens$": "<rootDir>/../../packages/ui-tokens/src/index.ts",
  "^@nidoru/validation$": "<rootDir>/../../packages/validation/src/index.ts",
};

module.exports = {
  watchman: false,
  projects: [
    {
      displayName: "unit",
      preset: "jest-expo",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/**/*.unit.jest.test.ts"],
      moduleNameMapper: workspacePackages,
    },
    {
      displayName: "component",
      preset: "jest-expo",
      testMatch: ["<rootDir>/tests/**/*.component.jest.test.tsx"],
      moduleNameMapper: workspacePackages,
    },
  ],
};
