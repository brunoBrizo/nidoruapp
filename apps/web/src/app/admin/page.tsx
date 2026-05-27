import type { Metadata } from "next";
import type { ReactElement } from "react";

import { routeShellById } from "../route-shells";
import { ShellPage } from "../shell-page";

const shell = routeShellById.admin;

export const metadata: Metadata = {
  title: shell.title,
  description: shell.summary,
};

export default function AdminPage(): ReactElement {
  return <ShellPage shell={shell} />;
}
