#!/usr/bin/env node
// Downloads the Supertonic 3 voice model into public/supertonic, so the board
// serves it itself instead of fetching it from Hugging Face in each browser.
//
//   npm run download-voice
//
// Set SUPERTONIC_URL to download from a different mirror of the same files.
import { createWriteStream } from "node:fs"
import { mkdir, rename, stat } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"

const REVISION = "aafc6e32416a594460b32413efc49d7fe4ce6d46"
const SOURCE =
  process.env.SUPERTONIC_URL ?? `https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/${REVISION}`
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/supertonic")

const FILES = [
  "LICENSE",
  "onnx/tts.json",
  "onnx/unicode_indexer.json",
  "onnx/duration_predictor.onnx",
  "onnx/text_encoder.onnx",
  "onnx/vector_estimator.onnx",
  "onnx/vocoder.onnx",
  ...["M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"].map((v) => `voice_styles/${v}.json`),
]

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function exists(file) {
  try {
    return (await stat(file)).size > 0
  } catch {
    return false
  }
}

let total = 0
for (const file of FILES) {
  const dest = path.join(OUT_DIR, file)
  if (await exists(dest)) {
    console.log(`✓ ${file} (already downloaded)`)
    continue
  }
  await mkdir(path.dirname(dest), { recursive: true })
  const res = await fetch(`${SOURCE}/${file}`)
  if (!res.ok || !res.body) {
    console.error(`✗ ${file}: HTTP ${res.status}`)
    process.exit(1)
  }
  const size = Number(res.headers.get("content-length")) || 0
  let received = 0
  let lastPrint = 0
  const body = Readable.fromWeb(res.body)
  body.on("data", (chunk) => {
    received += chunk.length
    if (size && process.stdout.isTTY && Date.now() - lastPrint > 250) {
      lastPrint = Date.now()
      process.stdout.write(`\r  ${file}: ${Math.round((received / size) * 100)}% of ${mb(size)}`)
    }
  })
  // Write to a temporary name so an interrupted download isn't mistaken for a complete one.
  await pipeline(body, createWriteStream(`${dest}.part`))
  await rename(`${dest}.part`, dest)
  total += received
  if (process.stdout.isTTY) process.stdout.write("\r\x1b[K")
  console.log(`✓ ${file} (${mb(received)})`)
}

console.log(`\nDone${total ? `: ${mb(total)} downloaded` : ""}. The board will use public/supertonic automatically.`)
