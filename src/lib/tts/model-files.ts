/*
 * Where the Supertonic 3 model files come from, and how they are kept.
 *
 * 1. A copy on this machine, under public/supertonic (see `npm run download-voice`),
 *    served with the board. Used whenever it is present.
 * 2. Otherwise VITE_SUPERTONIC_URL, if set at build time.
 * 3. Otherwise the archived Supertonic 3 snapshot on Hugging Face, pinned to a revision.
 *
 * Downloaded files are kept in the browser's Cache Storage, so each browser
 * downloads the model once. (Cache Storage needs https or localhost; on plain
 * http the browser's normal HTTP cache is used instead.)
 */
export const SUPERTONIC_REVISION = "aafc6e32416a594460b32413efc49d7fe4ce6d46"
const REMOTE_URL =
  import.meta.env.VITE_SUPERTONIC_URL ??
  `https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/${SUPERTONIC_REVISION}`
const LOCAL_URL = `${import.meta.env.BASE_URL}supertonic`
const CACHE_NAME = `supertonic-3-${SUPERTONIC_REVISION}`

let baseUrl: Promise<string> | null = null

/** Picks the local copy when it exists, otherwise the remote source. */
function resolveBaseUrl() {
  baseUrl ??= (async () => {
    try {
      const res = await fetch(`${LOCAL_URL}/onnx/tts.json`, { cache: "no-store" })
      // Dev servers answer unknown paths with index.html, so check it really is the config.
      if (res.ok) {
        JSON.parse(await res.text())
        return LOCAL_URL
      }
    } catch {
      // No local copy.
    }
    return REMOTE_URL
  })()
  return baseUrl
}

export async function modelSourceIsLocal() {
  return (await resolveBaseUrl()) === LOCAL_URL
}

async function openCache() {
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

/** Reads a response body, reporting progress (0–1) when the size is known. */
async function readWithProgress(res: Response, onProgress?: (fraction: number) => void) {
  const total = Number(res.headers.get("content-length")) || 0
  if (!res.body || !total || !onProgress) return new Uint8Array(await res.arrayBuffer())

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(Math.min(received / total, 1))
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

/** Fetches one model file (path relative to the model folder), from the browser cache when possible. */
export async function readModelFile(path: string, onProgress?: (fraction: number) => void) {
  const url = `${await resolveBaseUrl()}/${path}`
  const cache = await openCache()

  const cached = await cache?.match(url)
  if (cached) {
    onProgress?.(1)
    return new Uint8Array(await cached.arrayBuffer())
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`تعذّر تنزيل ${path} (${res.status})`)
  const bytes = await readWithProgress(res, onProgress)
  try {
    await cache?.put(url, new Response(bytes, { headers: { "content-type": "application/octet-stream" } }))
  } catch {
    // Out of quota or storage blocked; it will be downloaded again next time.
  }
  onProgress?.(1)
  return bytes
}

export async function readModelJson<T>(path: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await readModelFile(path))) as T
}
