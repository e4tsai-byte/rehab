/* Design audit — runs the checks that a screenshot cannot.
 *
 *   1. Contrast against the REAL composite backdrop. It walks up the ancestor
 *      chain compositing every semi-transparent background, so it measures what
 *      the pixel actually is once material, wash, and ambient field have stacked
 *      — not what the token intends. That distinction matters: this exact check
 *      caught --rehab-orange-deep at 3.93 on its own wash after static palette
 *      maths had passed it at 4.50 on white.
 *   2. Interactive targets under 44px.
 *   3. Nested glass — a backdrop-filter element inside another. Apple's HIG
 *      prohibits it and legibility collapses when it happens.
 *
 * Usage:
 *   npm i -D playwright && npx playwright install chromium
 *   npm run build && npx vite preview --port 4173 &
 *   node tools/audit.mjs
 */
import { chromium } from 'playwright'

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],
})
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, permissions:['camera'], locale:'zh-TW' })
const page = await ctx.newPage()
await page.goto('http://localhost:4173', { waitUntil:'networkidle' })
await page.evaluate(() => localStorage.setItem('rehabibi_session_history', JSON.stringify([
  {id:'s1',exerciseId:'right-arm-forward-flexion-standing',exerciseNameZh:'站姿右手前舉復健訓練',timestamp:1755740000000,
   completedReps:10,targetReps:10,cleanRepsCount:9,formQualityScorePct:90,averageHoldDurationS:5.1,peakElevationDeg:94,reps:[]}])))
await page.reload({ waitUntil:'networkidle' })
await page.waitForTimeout(600)

async function auditPage(page, label) {
const report = await page.evaluate(() => {
  const lin=(c)=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)
  const parse=(s)=>{const m=s.match(/[\d.]+/g).map(Number);return {r:m[0]/255,g:m[1]/255,b:m[2]/255,a:m[3]??1}}
  const lum=(c)=>0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b)
  const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1})
  function effBg(el){
    let cur=el, stack=[]
    while(cur && cur!==document.documentElement){
      const bg=parse(getComputedStyle(cur).backgroundColor)
      if(bg.a>0) stack.push(bg)
      if(bg.a===1) break
      cur=cur.parentElement
    }
    stack.push({r:1,g:1,b:1,a:1})
    return stack.reverse().reduce((acc,c)=>over(c,acc))
  }
  const cr=(a,b)=>{const L1=Math.max(lum(a),lum(b)),L2=Math.min(lum(a),lum(b));return (L1+0.05)/(L2+0.05)}

  const contrast=[], targets=[], nestedGlass=[]
  const isGlass=(el)=>{const s=getComputedStyle(el);return (s.backdropFilter&&s.backdropFilter!=='none')||(s.webkitBackdropFilter&&s.webkitBackdropFilter!=='none')}

  document.querySelectorAll('*').forEach(el=>{
    const s=getComputedStyle(el)
    const r=el.getBoundingClientRect()
    if(r.width===0||r.height===0||s.visibility==='hidden'||s.display==='none') return

    // direct text only
    const hasText=Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim().length>0)
    if(hasText){
      const fg=parse(s.color)
      const bg=effBg(el)
      const px=parseFloat(s.fontSize), w=parseInt(s.fontWeight)||400
      const large = px>=24 || (px>=18.66 && w>=700)
      const need = large?3:4.5
      const ratio=cr(over(fg,bg),bg)
      if(ratio<need) contrast.push({sel:el.className?.toString?.().slice(0,44)||el.tagName, text:el.textContent.trim().slice(0,18), px:+px.toFixed(1), ratio:+ratio.toFixed(2), need})
    }

    // interactive target size
    if(el.matches('button, a[href], input[type=range], input[type=checkbox]')){
      if(r.width<44||r.height<44) targets.push({sel:el.className?.toString?.().slice(0,44)||el.tagName, w:Math.round(r.width), h:Math.round(r.height)})
    }

    // Apple: never stack a light translucent surface on another
    if(isGlass(el)){
      let p=el.parentElement
      while(p&&p!==document.body){ if(isGlass(p)){ nestedGlass.push({child:el.className?.toString?.().slice(0,36), parent:p.className?.toString?.().slice(0,36)}); break } p=p.parentElement }
    }
  })
  return {contrast, targets, nestedGlass}
})

const show=(name,arr,fmt)=>{
  console.log(`   ${name}: ${arr.length}`)
  arr.slice(0,10).forEach(x=>console.log('      '+fmt(x)))
  if(arr.length>10) console.log(`      … ${arr.length-10} more`)
}
console.log(`\n══ ${label} ══`)
show('contrast failures', report.contrast, x=>`${x.ratio} < ${x.need}  ${x.px}px  "${x.text}"  .${x.sel}`)
show('tap targets < 44px', report.targets, x=>`${x.w}x${x.h}  .${x.sel}`)
show('nested glass', report.nestedGlass, x=>`.${x.child} inside .${x.parent}`)
return report.contrast.length + report.targets.length + report.nestedGlass.length
}

let total = 0
total += await auditPage(page, 'DASHBOARD')

await page.locator('.rehab-nav .btn--icon').first().click()
await page.waitForTimeout(500)
total += await auditPage(page, 'SETTINGS SHEET')
await page.keyboard.press('Escape'); await page.waitForTimeout(400)

await page.getByRole('button', { name: /開始訓練/ }).first().click()
await page.waitForTimeout(1600)
total += await auditPage(page, 'TRAINING — PRE-START')

await page.getByRole('button', { name: /開始這一組/ }).first().click()
await page.waitForTimeout(1800)
total += await auditPage(page, 'TRAINING — LIVE (over video)')

await page.getByRole('button', { name: /完成這一組/ }).first().click()
await page.waitForTimeout(900)
total += await auditPage(page, 'SESSION SUMMARY')

console.log(`\n${total===0 ? 'ALL SURFACES CLEAN' : total+' TOTAL ISSUES'}`)
await browser.close()
