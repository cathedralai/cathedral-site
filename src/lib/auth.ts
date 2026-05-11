/*
 * Auth bridge.
 *
 * Mirrors the Supabase pattern used elsewhere in the cathedral surface.
 * We load supabase-js from esm.sh at runtime so we don't add a build-time
 * dependency, and we use the same session storage key across pages so a
 * user signed in on any cathedral page stays signed in on the rest.
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
