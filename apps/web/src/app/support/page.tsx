import type { Metadata } from "next";

import { routeShellById } from "../route-shells";
import { ShellPage } from "../shell-page";

const shell = routeShellById.support;

export const metadata: Metadata = {
  title: shell.title,
  description: shell.summary,
};

export default function SupportPage() {
  return <ShellPage shell={shell} />;
}
