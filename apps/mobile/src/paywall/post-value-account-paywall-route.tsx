import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getOrCreateLocalInstallIdentity } from "../onboarding/local-first-onboarding";
import { captureSyncFailureDeferred } from "../observability/deferred-capture";
import { createPrivacySafeSyncFailureContext } from "../observability/sync-observability";
import { openMigratedLocalDatabase } from "../storage/local-database";
import { syncPostValueLocalRecords, type PostValueSyncDatabase } from "../sync/post-value-sync";
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
import {
  createPostValueSupabaseAuthenticator,
  createPostValueSupabaseClient,
} from "./post-value-supabase-auth";

type RouteState =
  | { readonly status: "loading" }
  | {
      readonly accessState: PostRewardPaywallEligibility;
      readonly database: PostValueAccountDatabase;
      readonly localInstallId: string;
      readonly status: "ready";
      readonly syncDatabase: PostValueSyncDatabase;
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
      const syncDatabase: PostValueSyncDatabase = {
        getAllAsync: (source, params = []) => database.getAllAsync(source, [...params]),
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
        syncDatabase,
      });

      if (accessState.status === "blocked") {
        router.replace("/(tabs)");
        return;
      }

      const authenticate = createPostValueSupabaseAuthenticator();
      const syncClient = createPostValueSupabaseClient();

      if (authenticate && syncClient) {
        void linkPostValueAccount(localDatabase, {
          authenticate,
          localInstallId,
          provider: "anonymous",
          syncLocalRecords: createPostValueSyncHandler(syncDatabase, syncClient),
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
      const syncClient = createPostValueSupabaseClient();

      if (!authenticate || !syncClient) {
        throw new Error("Supabase public auth is not configured in this build.");
      }

      const result = await linkPostValueAccount(routeState.database, {
        authenticate,
        localInstallId: routeState.localInstallId,
        provider,
        syncLocalRecords: createPostValueSyncHandler(routeState.syncDatabase, syncClient),
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

function createPostValueSyncHandler(
  database: PostValueSyncDatabase,
  client: Parameters<typeof syncPostValueLocalRecords>[0]["client"],
) {
  return async ({
    localInstallId,
    userId,
  }: {
    readonly localInstallId: string;
    readonly userId: string;
  }): Promise<void> => {
    const result = await syncPostValueLocalRecords({
      client,
      database,
      localInstallId,
      observeFailure: (failure) => {
        captureSyncFailureDeferred(createPrivacySafeSyncFailureContext(failure));
      },
      userId,
    });

    if (result.status !== "succeeded") {
      throw new Error(`post_value_sync_${result.reason}`);
    }
  };
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0D0F1A",
    flex: 1,
    justifyContent: "center",
  },
});
