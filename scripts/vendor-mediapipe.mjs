/* Copy MediaPipe's WASM runtime out of node_modules and into public/.
 *
 * WHY THIS EXISTS: the app used to load the runtime from
 * cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm and the model from
 * storage.googleapis.com. That broke invariant 1 in two ways — the app could
 * not start without a network, and a rehab surface was making remote requests.
 * It was also pinned to @latest, so every load executed whatever third-party
 * WebAssembly the CDN currently served, in the same origin as the camera stream,
 * with no guarantee it matched the pinned npm glue code.
 *
 * The wasm is COPIED rather than committed because it lives in the npm package
 * already: copying keeps it locked to the exact version in package.json and
 * keeps ~34 MB of binaries out of git. public/vendor/ is gitignored.
 *
 * The model (public/models/pose_landmarker_lite.task) is NOT in the npm package
 * and IS committed, because downloading it at build time would put the network
 * back on the critical path — the thing this script exists to remove.
 *
 * Runs on postinstall and prebuild, and is idempotent.
 */
import { cp, mkdir, access, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const dest = join(root, 'public', 'vendor', 'mediapipe', 'wasm')

try {
  await access(src)
} catch {
  console.error(
    '[vendor-mediapipe] @mediapipe/tasks-vision is not installed — run npm install first.',
  )
  process.exit(1)
}

await mkdir(dirname(dest), { recursive: true })
await cp(src, dest, { recursive: true })

const { version } = JSON.parse(
  await readFile(join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'package.json'), 'utf8'),
)
console.log(`[vendor-mediapipe] wasm v${version} -> public/vendor/mediapipe/wasm`)
