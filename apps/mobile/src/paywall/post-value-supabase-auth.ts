import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

import type { PostValueAuthenticate, PostValueAuthProvider } from "./post-value-account-linking";

type SupportedLinkProvider = Exclude<PostValueAuthProvider, "anonymous">;
type PostValueSupabaseClient = {
  readonly auth: {
    getUser(): Promise<{ data: { user: { id: string } | null } }>;
    linkIdentity(credentials: {
      readonly options: {
        readonly redirectTo: string;
        readonly skipBrowserRedirect: true;
      };
      readonly provider: SupportedLinkProvider;
    }): Promise<{ data: { url?: string | null }; error: unknown }>;
    signInAnonymously(): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
};

const supabaseSecureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export function createPostValueSupabaseAuthenticator(): PostValueAuthenticate | undefined {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!isConfiguredPublicValue(supabaseUrl) || !isConfiguredPublicValue(publishableKey)) {
    return undefined;
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: supabaseSecureStorage,
    },
  });

  return async ({ provider }) => {
    const userId = await getOrCreateAnonymousUserId(supabase);

    if (provider !== "anonymous") {
      await startProviderLink(supabase, provider);
    }

    return { userId };
  };
}

function isConfiguredPublicValue(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0 && !value.startsWith("<");
}

async function getOrCreateAnonymousUserId(supabase: PostValueSupabaseClient): Promise<string> {
  const existingUser = await supabase.auth.getUser();

  if (existingUser.data.user?.id) {
    return existingUser.data.user.id;
  }

  const anonymousSignIn = await supabase.auth.signInAnonymously();

  if (anonymousSignIn.error || !anonymousSignIn.data.user?.id) {
    throw anonymousSignIn.error ?? new Error("Anonymous Supabase auth did not return a user.");
  }

  return anonymousSignIn.data.user.id;
}

async function startProviderLink(
  supabase: PostValueSupabaseClient,
  provider: SupportedLinkProvider,
): Promise<void> {
  const linkResponse = await supabase.auth.linkIdentity({
    options: {
      redirectTo: Linking.createURL("post-value"),
      skipBrowserRedirect: true,
    },
    provider,
  });

  if (linkResponse.error) {
    throw linkResponse.error;
  }

  if (linkResponse.data.url) {
    await Linking.openURL(linkResponse.data.url);
  }
}
