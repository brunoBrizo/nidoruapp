import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: repoRoot,
  },
  transpilePackages: ["@nidoru/domain", "@nidoru/i18n", "@nidoru/ui-tokens", "@nidoru/validation"],
};

export default nextConfig;
