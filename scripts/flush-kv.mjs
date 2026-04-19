// Flushes all "game:*" keys from the Vercel KV (Upstash Redis) store.
// Usage: node scripts/flush-kv.mjs   (reads KV_REST_API_URL + KV_REST_API_TOKEN from .env.local)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const URL = process.env.KV_REST_API_URL
const TOKEN = process.env.KV_REST_API_TOKEN
if (!URL || !TOKEN) { console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN'); process.exit(1) }

async function kv(...cmd) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  if (!res.ok) throw new Error(`KV ${cmd[0]} failed: ${res.status} ${await res.text()}`)
  return (await res.json()).result
}

let cursor = '0'
let total = 0
do {
  const [next, keys] = await kv('SCAN', cursor, 'MATCH', 'game:*', 'COUNT', 200)
  if (keys.length) {
    await kv('DEL', ...keys)
    total += keys.length
    console.log(`  deleted ${keys.length} keys …`)
  }
  cursor = next
} while (cursor !== '0')

console.log(`\nFlushed ${total} game:* keys from KV.`)
