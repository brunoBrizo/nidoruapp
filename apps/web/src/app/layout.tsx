import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

import "./globals.css";
import { sharedWebFoundation } from "./route-shells";

export const metadata: Metadata = {
  title: {
    default: sharedWebFoundation.appName,
    template: `%s | ${sharedWebFoundation.appName}`,
  },
  description: "Public web foundation for Nidoru marketing, legal, support, and admin surfaces.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
