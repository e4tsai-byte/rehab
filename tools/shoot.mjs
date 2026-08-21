/* Screenshot harness. Captures every surface at three viewports, with a fake
 * camera device so the training surface renders without a webcam.
 *
 * The fake device emits a bright rolling pattern, which is deliberately useful:
 * it is close to the worst case for over-video legibility, so the HUD and form
 * alerts get checked against a blown-out frame rather than a convenient one.
 *
 * Usage:
 *   npm i -D playwright && npx playwright install chromium
 *   npm run build && npx vite preview --port 4173 &
 *   node tools/shoot.mjs <label>
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = process.argv[2] || 'baseline'
const BASE = 'http://localhost:4173'
mkdirSync(`shots/${OUT}`, { recursive: true })

const SEED = [
  { id:'s1', exerciseId:'right-arm-forward-flexion-standing', exerciseNameZh:'站姿右手前舉復健訓練',
    timestamp: 1755740000000, completedReps:10, targetReps:10, cleanRepsCount:9, formQualityScorePct:90,
    averageHoldDurationS:5.1, peakElevationDeg:94, reps:[] },
  { id:'s2', exerciseId:'right-arm-forward-flexion-seated', exerciseNameZh:'坐姿桌前前舉復健訓練',
    timestamp: 1755650000000, completedReps:8, targetReps:10, cleanRepsCount:5, formQualityScorePct:63,
    averageHoldDurationS:4.2, peakElevationDeg:88, reps:[] },
  { id:'s3', exerciseId:'right-arm-forward-flexion-standing', exerciseNameZh:'站姿右手前舉復健訓練',
    timestamp: 1755560000000, completedReps:10, targetReps:10, cleanRepsCount:10, formQualityScorePct:100,
    averageHoldDurationS:5.4, peakElevationDeg:97, reps:[] },
]

const VIEWPORTS = [
  { name:'desktop', width:1440, height:900 },
  { name:'tablet',  width:834,  height:1112 },
  { name:'mobile',  width:390,  height:844 },
]

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--allow-file-access-from-files'],
})

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    permissions: ['camera'],
    locale: 'zh-TW',
  })
  const page = await ctx.newPage()
  page.on('console', m => { if (m.type()==='error') console.log(`  [${vp.name} console] ${m.text().slice(0,160)}`) })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate((seed) => {
    localStorage.setItem('rehabibi_session_history', JSON.stringify(seed))
  }, SEED)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path:`shots/${OUT}/${vp.name}-01-dashboard.png`, fullPage:true })

  // Settings sheet
  const gear = page.locator('.rehab-nav .btn--icon').first()
  if (await gear.count()) {
    await gear.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path:`shots/${OUT}/${vp.name}-02-settings.png` })
    await page.keyboard.press('Escape').catch(()=>{})
    await page.mouse.click(5,5)
    await page.waitForTimeout(300)
  }

  // Training — pre-start
  const start = page.getByRole('button', { name: /開始訓練/ }).first()
  if (await start.count()) {
    await start.click()
    await page.waitForTimeout(1800)
    await page.screenshot({ path:`shots/${OUT}/${vp.name}-03-training-prestart.png`, fullPage:true })

    // Training — started (fake camera feed running)
    const begin = page.getByRole('button', { name: /開始這一組/ }).first()
    if (await begin.count()) {
      await begin.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path:`shots/${OUT}/${vp.name}-04-training-live.png`, fullPage:true })
    }

    // Summary — finish the set (0 reps: also the edge case)
    const finish = page.getByRole('button', { name: /完成這一組/ }).first()
    if (await finish.count()) {
      await finish.click()
      await page.waitForTimeout(900)
      await page.screenshot({ path:`shots/${OUT}/${vp.name}-05-summary.png`, fullPage:true })
    }
  }
  await ctx.close()
  console.log(`  ${vp.name} done`)
}
await browser.close()
console.log('screenshots →', `shots/${OUT}`)
