import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getOrCreateLocalInstallIdentity } from "../onboarding/local-first-onboarding";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  linkPostValueAccount,
  loadPostRewardPaywallEligibility,
  restorePostValuePurchase,
  type PostRewardPaywallEligibility,
  type PostValueAccountDatabase,
  type PostValueAuthProvider,
  type PostValuePlanId,
} from "./post-value-account-linking";
import { PostValueAccountPaywallScreen } from "./post-value-account-paywall-screen";
import { createPostValueSupabaseAuthenticator } from "./post-value-supabase-auth";

type RouteState =
  | { readonly status: "loading" }
  | {
      readonly accessState: PostRewardPaywallEligibility;
      readonly database: PostValueAccountDatabase;
      readonly localInstallId: string;
      readonly status: "ready";
    };

export function PostValueAccountPaywallRouteScreen() {
  const router = useRouter();
  const [routeState, setRouteState] = useState<RouteState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadRouteState() {
      const database = await openMigratedLocalDatabase();
      const localDatabase: PostValueAccountDatabase = {
        getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
        runAsync: (source, params = []) => database.runAsync(source, [...params]),
      };
      const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
      const accessState = await loadPostRewardPaywallEligibility(localDatabase, {
        entitlementState: "not_entitled",
        localInstallId,
        paywallExperiment: "show_paywall",
      });

      if (!isMounted) {
        return;
      }

      setRouteState({
        accessState,
        database: localDatabase,
        localInstallId,
        status: "ready",
      });

      if (accessState.status === "blocked") {
        router.replace("/(tabs)");
        return;
      }

      const authenticate = createPostValueSupabaseAuthenticator();

      if (authenticate) {
        void linkPostValueAccount(localDatabase, {
          authenticate,
          localInstallId,
          provider: "anonymous",
          syncLocalRecords: async () => undefined,
        }).catch(() => undefined);
      }
    }

    void loadRouteState().catch(() => {
      if (isMounted) {
        router.replace("/(tabs)");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleContinueFree = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  const handleLinkAccount = useCallback(
    async (provider: Exclude<PostValueAuthProvider, "anonymous">) => {
      if (routeState.status !== "ready") {
        return;
      }

      const authenticate = createPostValueSupabaseAuthenticator();

      if (!authenticate) {
        throw new Error("Supabase public auth is not configured in this build.");
      }

      const result = await linkPostValueAccount(routeState.database, {
        authenticate,
        localInstallId: routeState.localInstallId,
        provider,
        syncLocalRecords: async () => undefined,
      });

      if (result.status !== "linked") {
        throw new Error(result.status);
      }
    },
    [routeState],
  );

  const handleRestorePurchase = useCallback(async () => {
    if (routeState.status !== "ready") {
      return;
    }

    await restorePostValuePurchase(routeState.database, {
      localInstallId: routeState.localInstallId,
      restorePurchases: async () => ({ restored: true }),
    });
  }, [routeState]);

  const handleStartTrial = useCallback(async (planId: PostValuePlanId) => {
    void planId;
    throw new Error("RevenueCat packages are not configured in this local build.");
  }, []);

  if (routeState.status === "loading") {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#7C6FCD" />
      </View>
    );
  }

  return (
    <PostValueAccountPaywallScreen
      accessState={routeState.accessState}
      onContinueFree={handleContinueFree}
      onLinkAccount={handleLinkAccount}
      onRestorePurchase={handleRestorePurchase}
      onStartTrial={handleStartTrial}
    />
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0D0F1A",
    flex: 1,
    justifyContent: "center",
  },
});
