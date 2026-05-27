import {
  AuthClient,
  type AuthResponse,
  type OAuthResponse,
  type SignInAnonymouslyCredentials,
  type SignInWithOAuthCredentials,
  type UserResponse,
} from "@supabase/auth-js";
import { createURL, openURL } from "expo-linking";
import * as SecureStore from "expo-secure-store";

import type { PostValueSyncClient } from "../sync/post-value-sync";
import type { PostValueAuthenticate, PostValueAuthProvider } from "./post-value-account-linking";

type SupportedLinkProvider = Exclude<PostValueAuthProvider, "anonymous">;
type SupabaseAuthClient = InstanceType<typeof AuthClient>;
type PostValueSupabaseClient = PostValueSyncClient & {
  getUser(jwt?: string): Promise<UserResponse>;
  linkIdentity(credentials: SignInWithOAuthCredentials): Promise<OAuthResponse>;
  signInAnonymously(credentials?: SignInAnonymouslyCredentials): Promise<AuthResponse>;
};
type PostValueAuthClient = Pick<
  SupabaseAuthClient,
  "getSession" | "getUser" | "linkIdentity" | "signInAnonymously"
>;

const postValueSyncTables = {
  breath_sessions: "user_id,local_session_id",
  first_session_sync_records: "user_id,local_session_id",
  local_install_links: "local_install_id",
  post_session_reflection_sync_records: "user_id,local_reflection_id",
  wind_down_runs: "user_id,local_run_id",
} as const;

const supabaseSecureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export function createPostValueSupabaseAuthenticator(): PostValueAuthenticate | undefined {
  const supabase = createPostValueSupabaseClient();

  if (!supabase) {
    return undefined;
  }

  return async ({ provider }) => {
    const userId = await getOrCreateAnonymousUserId(supabase);

    if (provider !== "anonymous") {
      await startProviderLink(supabase, provider);
    }

    return { userId };
  };
}

export function createPostValueSupabaseClient(): PostValueSupabaseClient | undefined {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!isConfiguredPublicValue(supabaseUrl) || !isConfiguredPublicValue(publishableKey)) {
    return undefined;
  }

  const baseUrl = parseSupabaseUrl(supabaseUrl);

  if (!baseUrl) {
    return undefined;
  }

  const authClient = new AuthClient({
    autoRefreshToken: true,
    detectSessionInUrl: false,
    headers: createSupabaseHeaders(publishableKey),
    persistSession: true,
    storage: supabaseSecureStorage,
    storageKey: createSupabaseStorageKey(baseUrl),
    url: createSupabaseServiceUrl(baseUrl, "auth/v1"),
  });

  return {
    getUser: (jwt?: string): Promise<UserResponse> => authClient.getUser(jwt),
    linkIdentity: (credentials) => authClient.linkIdentity(credentials),
    signInAnonymously: (credentials) => authClient.signInAnonymously(credentials),
    from: (tableName) => ({
      upsert: (values, { onConflict }) =>
        upsertPostValueRecords({
          authClient,
          baseUrl,
          onConflict,
          publishableKey,
          tableName,
          values,
        }),
    }),
  };
}

function isConfiguredPublicValue(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0 && !value.startsWith("<");
}

async function getOrCreateAnonymousUserId(supabase: PostValueSupabaseClient): Promise<string> {
  const existingUser = await supabase.getUser();

  if (existingUser.data.user?.id) {
    return existingUser.data.user.id;
  }

  const anonymousSignIn = await supabase.signInAnonymously();

  if (anonymousSignIn.error || !anonymousSignIn.data.user?.id) {
    throw anonymousSignIn.error ?? new Error("Anonymous Supabase auth did not return a user.");
  }

  return anonymousSignIn.data.user.id;
}

async function startProviderLink(
  supabase: PostValueSupabaseClient,
  provider: SupportedLinkProvider,
): Promise<void> {
  const linkResponse = await supabase.linkIdentity({
    options: {
      redirectTo: createURL("post-value"),
      skipBrowserRedirect: true,
    },
    provider,
  });

  if (linkResponse.error) {
    throw linkResponse.error;
  }

  if (linkResponse.data.url) {
    await openURL(linkResponse.data.url);
  }
}

function parseSupabaseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function createSupabaseServiceUrl(baseUrl: URL, servicePath: string): string {
  return new URL(servicePath, baseUrl).href.replace(/\/$/, "");
}

function createSupabaseStorageKey(baseUrl: URL): string {
  return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
}

function createSupabaseHeaders(publishableKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${publishableKey}`,
    apikey: publishableKey,
    "X-Client-Info": "nidoru-mobile",
  };
}

async function upsertPostValueRecords({
  authClient,
  baseUrl,
  onConflict,
  publishableKey,
  tableName,
  values,
}: {
  readonly authClient: PostValueAuthClient;
  readonly baseUrl: URL;
  readonly onConflict: string;
  readonly publishableKey: string;
  readonly tableName: string;
  readonly values: Record<string, unknown> | readonly Record<string, unknown>[];
}): Promise<{ readonly error?: unknown }> {
  if (!isAllowedPostValueSyncTarget(tableName, onConflict)) {
    return {
      error: {
        message: "Unsupported post-value sync target.",
        status: 400,
      },
    };
  }

  const sessionResult = await authClient.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (!accessToken) {
    return {
      error: {
        message: "Supabase auth session is required before post-value sync.",
        status: 401,
      },
    };
  }

  const syncUrl = new URL(`rest/v1/${tableName}`, baseUrl);
  syncUrl.searchParams.set("on_conflict", onConflict);

  try {
    const response = await fetch(syncUrl.href, {
      body: JSON.stringify(values),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
        apikey: publishableKey,
      },
      method: "POST",
    });

    if (!response.ok) {
      return { error: await createPostValueSyncHttpError(response) };
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
}

function isAllowedPostValueSyncTarget(tableName: string, onConflict: string): boolean {
  return (
    tableName in postValueSyncTables &&
    postValueSyncTables[tableName as keyof typeof postValueSyncTables] === onConflict
  );
}

async function createPostValueSyncHttpError(response: Response): Promise<{
  readonly code?: string;
  readonly message: string;
  readonly status: number;
}> {
  const fallbackMessage = `Supabase post-value sync failed with HTTP ${response.status}.`;

  try {
    const body = (await response.json()) as { readonly code?: unknown; readonly message?: unknown };

    return {
      ...(typeof body.code === "string" ? { code: body.code } : {}),
      message: typeof body.message === "string" ? body.message : fallbackMessage,
      status: response.status,
    };
  } catch {
    return {
      message: fallbackMessage,
      status: response.status,
    };
  }
}
