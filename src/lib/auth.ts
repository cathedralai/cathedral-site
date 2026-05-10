/*
 * Auth bridge.
 *
 * Mirrors the Supabase pattern used in afrotensor (search "getSupabase" in
 * src/pages/afrotensor.astro). We load supabase-js from esm.sh at runtime
 * so we don't add a build-time dependency, and we use the same session
 * storage key so a user signed in on /afrotensor stays signed in on
 * cathedral pages and vice versa.
 *
 * Anything that needs an authenticated call goes through `authedFetch`.
 */

declare global {
  interface Window {
    __cathedralAuth?: {
      getSupabase: () => Promise<unknown>
      currentAccessToken: () => Promise<string | null>
      authedFetch: (path: string, init?: RequestInit) => Promise<unknown>
      signOut: () => Promise<void>
      onAuthChange: (cb: (loggedIn: boolean) => void) => void
    }
  }
}

export {}
