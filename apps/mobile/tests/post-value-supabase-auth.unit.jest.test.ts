import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockAuthMethods = {
  getSession: jest.fn(),
  getUser: jest.fn(),
  linkIdentity: jest.fn(),
  signInAnonymously: jest.fn(),
};
const mockAuthClient = jest.fn();
const mockCreateURL = jest.fn(() => "nidoru://post-value");
const mockOpenURL = jest.fn();

jest.mock("@supabase/auth-js", () => ({
  AuthClient: class {
    constructor(options: unknown) {
      mockAuthClient(options);
      return mockAuthMethods;
    }
  },
}));

jest.mock("expo-linking", () => ({
  __esModule: true,
  createURL: mockCreateURL,
  openURL: mockOpenURL,
}));

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import {
  createPostValueSupabaseAuthenticator,
  createPostValueSupabaseClient,
} from "../src/paywall/post-value-supabase-auth";

const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalPublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const originalFetch = global.fetch;

describe("post-value Supabase auth client", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    mockAuthClient.mockClear();
    mockCreateURL.mockClear();
    mockOpenURL.mockClear();
    Object.values(mockAuthMethods).forEach((method) => method.mockReset());
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey;
    global.fetch = originalFetch;
  });

  it("creates a Supabase Auth client without importing the full Supabase bundle", () => {
    const client = createPostValueSupabaseClient();

    expect(client).toBeDefined();
    expect(mockAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({
        autoRefreshToken: true,
        detectSessionInUrl: false,
        headers: {
          Authorization: "Bearer publishable-key",
          apikey: "publishable-key",
          "X-Client-Info": "nidoru-mobile",
        },
        persistSession: true,
        storageKey: "sb-project-ref-auth-token",
        url: "https://project-ref.supabase.co/auth/v1",
      }),
    );
  });

  it("uses the authenticated session token for allowlisted post-value sync upserts", async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        status: 201,
      }),
    );
    global.fetch = fetchMock as typeof fetch;
    mockAuthMethods.getSession.mockResolvedValue({
      data: { session: { access_token: "user-access-token" } },
      error: null,
    });

    const client = createPostValueSupabaseClient();

    await expect(
      client?.from("local_install_links").upsert(
        {
          local_install_id: "install_0123456789abcdef",
          user_id: "123e4567-e89b-12d3-a456-426614174000",
        },
        { onConflict: "local_install_id" },
      ),
    ).resolves.toEqual({ error: null });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://project-ref.supabase.co/rest/v1/local_install_links?on_conflict=local_install_id",
      {
        body: JSON.stringify({
          local_install_id: "install_0123456789abcdef",
          user_id: "123e4567-e89b-12d3-a456-426614174000",
        }),
        headers: {
          Authorization: "Bearer user-access-token",
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
          apikey: "publishable-key",
        },
        method: "POST",
      },
    );
  });

  it("rejects unsupported sync targets before any network request", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    mockAuthMethods.getSession.mockResolvedValue({
      data: { session: { access_token: "user-access-token" } },
      error: null,
    });
    const client = createPostValueSupabaseClient();

    await expect(
      client?.from("profiles").upsert(
        {
          user_id: "123e4567-e89b-12d3-a456-426614174000",
        },
        { onConflict: "user_id" },
      ),
    ).resolves.toEqual({
      error: {
        message: "Unsupported post-value sync target.",
        status: 400,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in anonymously before post-value sync", async () => {
    mockAuthMethods.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuthMethods.signInAnonymously.mockResolvedValue({
      data: {
        session: { access_token: "user-access-token" },
        user: { id: "123e4567-e89b-12d3-a456-426614174000" },
      },
      error: null,
    });

    const authenticate = createPostValueSupabaseAuthenticator();

    await expect(authenticate?.({ provider: "anonymous" })).resolves.toEqual({
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(mockAuthMethods.linkIdentity).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
