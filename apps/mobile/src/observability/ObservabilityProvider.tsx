import type { ReactNode } from "react";
import { PostHogProvider } from "posthog-react-native";

import { posthogClient } from "./posthog";

type ObservabilityProviderProps = {
  children: ReactNode;
};

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  if (!posthogClient) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider autocapture={false} client={posthogClient}>
      {children}
    </PostHogProvider>
  );
}
