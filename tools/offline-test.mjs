/* Proves invariant 1: the app runs with no network, under a deployed subpath.
 *
 * Two things are asserted that a screenshot cannot show:
 *   1. Every request to a host other than the local server is ABORTED, so a
 *      single reintroduced CDN reference fails the test rather than silently
 *      working on the developer's machine.
 *   2. dist/ is served under /rehab/ rather than /, which is what GitHub Pages
 *      actually does. Site-absolute asset paths pass locally at / and 404 there;
 *      this harness is the only thing that catches that before deploy.
 *
 * Usage:
 *   npm run build
 *   node tools/offline-test.mjs
 *
 * Needs playwright (npm i -D playwright && npx playwright install chromium).
 * Set CHROMIUM_PATH to use an existing browser.
 */
import { chromium } from 'playwright'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

// Serve dist/ under /rehab/ — mimics a GitHub Pages project subpath, which is
// exactly the condition the absolute /images/ paths failed under.
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.wasm':'application/wasm', '.task':'application/octet-stream', '.jpg':'image/jpeg',
  '.png':'image/png', '.woff':'font/woff', '.woff2':'font/woff2', '.svg':'image/svg+xml' }

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (!p.startsWith('/rehab/')) { res.writeHead(404).end('outside base'); return }
  p = p.slice('/rehab'.length)
  if (p === '/' || p === '') p = '/index.html'
  const file = join('dist', normalize(p).replace(/^(\.\.[/\\])+/, ''))
  try {
    const buf = await readFile(file)
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(buf)
  } catch {
    res.writeHead(404).end('not found')
  }
})
await new Promise(r => server.listen(4180, r))

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],
})
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, permissions:['camera'], locale:'zh-TW' })
const page = await ctx.newPage()

// HARD OFFLINE: abort every request that is not our local origin.
const external = [], failed = [], notFound = []
await page.route('**', async (route) => {
  const url = route.request().url()
  if (url.startsWith('http://localhost:4180') || url.startsWith('data:') || url.startsWith('blob:')) {
    return route.continue()
  }
  external.push(url)
  return route.abort()
})
page.on('requestfailed', r => failed.push(r.url()))
page.on('response', r => { if (r.status() >= 400) notFound.push(`${r.status()} ${r.url()}`) })
page.on('console', m => { if (m.type()==='error') console.log('  [console error]', m.text().slice(0,140)) })

console.log('── loading app at http://localhost:4180/rehab/ with all external hosts blocked ──')
await page.goto('http://localhost:4180/rehab/', { waitUntil:'networkidle' })
await page.waitForTimeout(1200)

// Enter training so the tracker actually initialises
const start = page.getByRole('button', { name: /開始訓練|開始/ }).first()
if (await start.count()) { await start.click(); await page.waitForTimeout(1500) }

// isLoaded flips the "載入中" suffix off the mode chip
console.log('\n── waiting for the pose model to finish loading (local assets only) ──')
let loaded = false
for (let i = 0; i < 40; i++) {
  const chip = await page.locator('.vchip--mode').first().textContent().catch(() => '')
  if (chip && !chip.includes('載入中')) { loaded = true; break }
  await page.waitForTimeout(500)
}
const chipText = await page.locator('.vchip--mode').first().textContent().catch(() => '(no chip)')

console.log(`   mode chip: ${JSON.stringify(chipText)}`)
console.log(`   model loaded offline: ${loaded ? 'YES' : 'NO'}`)

console.log(`\n── external requests attempted: ${external.length} ──`)
;[...new Set(external)].slice(0,8).forEach(u => console.log('   ' + u))
console.log(`\n── HTTP >=400: ${notFound.length} ──`)
;[...new Set(notFound)].slice(0,10).forEach(u => console.log('   ' + u))

// image resolution under the subpath
const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, ok: i.naturalWidth > 0 })))
console.log(`\n── <img> resolution under /rehab/: ${imgs.length} images ──`)
imgs.slice(0,6).forEach(i => console.log(`   ${i.ok ? 'OK  ' : 'FAIL'} ${i.src}`))

await import('node:fs').then(m => m.mkdirSync('shots', { recursive: true }))
await page.screenshot({ path:'shots/offline-training.png', fullPage:false })
const verdict = loaded && external.length === 0 && notFound.length === 0 && imgs.every(i=>i.ok)
console.log(`\n${verdict ? 'PASS — works fully offline under a subpath' : 'ISSUES ABOVE'}`)
await browser.close(); server.close()
