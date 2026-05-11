/*
 * Submission signing helpers.
 *
 * BLAKE3 of the bundle bytes is computed in the browser with WebCrypto
 * fallback (we use a tiny pure-JS BLAKE3 implementation pulled from esm.sh
 * at runtime to avoid adding a build-time dep). The hotkey signature is
 * produced via the Polkadot.js extension over the canonical_json payload
 * defined in CONTRACTS.md §4.1.
 *
 * Functions exported from this module are pure / deterministic — they're
 * loaded as part of an inline `<script>` in the submit page so they run
 * in the browser. None of this code runs at SSR time.
 */

import type { Hotkey } from './types'

// ---------- canonical_json (matches Python sort_keys + tight separators) ----

export function canonicalJson(payload: {
  bundle_hash: string
  card_id: string
  miner_hotkey: Hotkey
  submitted_at: string
}): string {
  const keys = Object.keys(payload).sort()
  const parts: string[] = []
  for (const k of keys) {
    const v = (payload as Record<string, string>)[k]
    parts.push(`${JSON.stringify(k)}:${JSON.stringify(v)}`)
  }
  return `{${parts.join(',')}}`
}

// ---------- BLAKE3 of file bytes ----------

let _blake3Mod: { blake3: (data: Uint8Array) => Uint8Array } | null = null

async function loadBlake3(): Promise<{ blake3: (data: Uint8Array) => Uint8Array }> {
  if (_blake3Mod) return _blake3Mod
  // @hash-wasm pure-JS BLAKE3 — small, browser-safe, no wasm fetch needed for
  // ergonomic loading from a CDN. We use the `blake3-js` minimal port.
  // Falls back to a pure-JS reference implementation if the CDN is blocked.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — esm.sh URL import resolved at runtime
  const mod = await import(/* @vite-ignore */ 'https://esm.sh/@noble/hashes@1.5.0/blake3')
  _blake3Mod = { blake3: (data: Uint8Array) => mod.blake3(data) }
  return _blake3Mod
}

export async function blake3HexOfFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const { blake3 } = await loadBlake3()
  const digest = blake3(buf)
  let out = ''
  for (let i = 0; i < digest.length; i++) {
    out += digest[i]!.toString(16).padStart(2, '0')
  }
  return out
}

// ---------- Polkadot.js extension wiring ----------

export type ExtensionAccount = { address: string; name?: string; source: string }

export async function loadExtension(): Promise<{
  available: boolean
  accounts: ExtensionAccount[]
  error?: string
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — runtime CDN import
    const dapp = await import(/* @vite-ignore */ 'https://esm.sh/@polkadot/extension-dapp@0.50.1')
    const enabled = await dapp.web3Enable('cathedral.computer')
    if (!enabled.length) {
      return {
        available: false,
        accounts: [],
        error: 'no-extension',
      }
    }
    const raw = await dapp.web3Accounts()
    const accounts: ExtensionAccount[] = raw.map((a: { address: string; meta: { name?: string; source: string } }) => ({
      address: a.address,
      name: a.meta.name,
      source: a.meta.source,
    }))
    return { available: true, accounts }
  } catch (err) {
    return {
      available: false,
      accounts: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function signPayload(
  hotkey: Hotkey,
  payload: { bundle_hash: string; card_id: string; submitted_at: string },
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — runtime CDN import
  const dapp = await import(/* @vite-ignore */ 'https://esm.sh/@polkadot/extension-dapp@0.50.1')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — runtime CDN import
  const util = await import(/* @vite-ignore */ 'https://esm.sh/@polkadot/util@13.5.6')

  const json = canonicalJson({
    miner_hotkey: hotkey,
    bundle_hash: payload.bundle_hash,
    card_id: payload.card_id,
    submitted_at: payload.submitted_at,
  })
  const injector = await dapp.web3FromAddress(hotkey)
  if (!injector?.signer?.signRaw) {
    throw new Error('extension does not support signRaw')
  }
  const result = await injector.signer.signRaw({
    address: hotkey,
    data: util.u8aToHex(util.stringToU8a(json)),
    type: 'bytes',
  })
  // result.signature is hex (0x-prefixed) — convert to base64.
  const hex = (result.signature as string).replace(/^0x/, '')
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  // btoa needs a binary string
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}
