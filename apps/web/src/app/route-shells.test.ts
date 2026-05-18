import { routeShells } from "./route-shells";

const requiredShellIds = ["marketing", "legal", "support", "admin"] as const;

type RequiredShellId = (typeof requiredShellIds)[number];
type ActualShellId = (typeof routeShells)[number]["id"];

const shellIdCoverage: Record<RequiredShellId, Extract<ActualShellId, RequiredShellId>> = {
  marketing: "marketing",
  legal: "legal",
  support: "support",
  admin: "admin",
};

const shellPaths: Record<RequiredShellId, string> = {
  marketing: "/",
  legal: "/legal",
  support: "/support",
  admin: "/admin",
};

for (const shell of routeShells) {
  const expectedPath = shellPaths[shell.id];
  const coveredShellId = shellIdCoverage[shell.id];

  void expectedPath;
  void coveredShellId;
}

for (const shellId of requiredShellIds) {
  const expectedPath = shellPaths[shellId];
  const coveredShellId = shellIdCoverage[shellId];

  void expectedPath;
  void coveredShellId;
}
