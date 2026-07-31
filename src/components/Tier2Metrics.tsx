/* ─────────────────────────────────────────────────────────────────────────────
   Per-trial Tier 2 movement-quality metrics. SCHEMA-READY DISPLAY, not a
   preview of data -- distinct from Tier2Panel.tsx (the roadmap panel), which
   speaks for the whole product once. This component speaks for one trial.

   `tier2` is `undefined` for every trial this build can ever produce (see
   domain/types.ts's Tier 2 section for why). This is intentional, not a
   loading state: there is no pose model in this build, so a real value here
   is fabricated no matter how the code is written. When `tier2` is
   undefined, the ONLY thing this component renders is an explicit
   not-yet-available panel, styled like Tier2Panel (dashed border, no
   numerals) so it cannot be mistaken at a glance for a measured block.

   When `tier2` IS present (August onward, once Tier 2 ships), this exact
   component renders the real summary + per-rep table instead -- the whole
   point of building this now is that nothing about the surrounding page
   needs to change when that day comes, only the data flowing into this prop.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from './Digits'
import type { Tier2TrialMetrics } from '../domain/types'
import { strings } from '../i18n/strings'

export function Tier2Metrics({
  tier2,
  phaseWord,
}: {
  tier2: Tier2TrialMetrics | undefined
  phaseWord: string
}) {
  const s = strings.tier2Metrics

  if (!tier2) {
    return (
      <section className="t2m t2m--pending" aria-labelledby="t2m-title">
        <header className="t2m__head">
          <h3 className="t2m__title" id="t2m-title">
            {s.title}
            <span className="sr-only">（{phaseWord}）</span>
          </h3>
          <span className="t2m__status">{s.notAvailable}</span>
        </header>
        <p className="t2m__hint">{s.hint}</p>
        <p className="t2m__body">{s.notAvailableBody}</p>
      </section>
    )
  }

  return (
    <section className="t2m t2m--live" aria-labelledby="t2m-title">
      <header className="t2m__head">
        <h3 className="t2m__title" id="t2m-title">
          {s.title}
          <span className="sr-only">（{phaseWord}）</span>
        </h3>
      </header>

      <h4 className="t2m__sub">{s.summaryTitle}</h4>
      <dl className="t2m__summary">
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.exerciseLabel}</dt>
          <dd className="t2m-stat__value">{tier2.exerciseId}</dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.difficultyStepLabel}</dt>
          <dd className="t2m-stat__value">{tier2.difficultyStepLabel}</dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.repCountLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.repCount} />
          </dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.meanVelocityFirstLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.meanVelocityFirst.toFixed(2)} />
          </dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.meanVelocityLastLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.meanVelocityLast.toFixed(2)} />
          </dd>
        </div>
        <div className="t2m-stat t2m-stat--lead">
          <dt className="t2m-stat__label">{s.velocityLossLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.velocityLossPct.toFixed(1)} />%
          </dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.meanRomLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.meanRomDeg.toFixed(1)} />°
          </dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.flagCountLabel}</dt>
          <dd className="t2m-stat__value">
            <Digits value={tier2.flagCount} />
          </dd>
        </div>
        <div className="t2m-stat">
          <dt className="t2m-stat__label">{s.trackingConfidenceLabel}</dt>
          <dd className="t2m-stat__value">{tier2.trackingConfidenceSummary}</dd>
        </div>
      </dl>

      {tier2.perRep.length > 0 && (
        <>
          <h4 className="t2m__sub">{s.perRepTitle}</h4>
          <div className="t2m__table-wrap">
            <table className="t2m__table">
              <thead>
                <tr>
                  <th scope="col">{s.repIndexLabel}</th>
                  <th scope="col">{s.concentricTimeLabel}</th>
                  <th scope="col">{s.peakVelocityLabel}</th>
                  <th scope="col">{s.meanVelocityLabel}</th>
                  <th scope="col">{s.romLabel}</th>
                  <th scope="col">{s.minAngleLabel}</th>
                  <th scope="col">{s.maxAngleLabel}</th>
                  <th scope="col">{s.flagsLabel}</th>
                  <th scope="col">{s.timestampLabel}</th>
                </tr>
              </thead>
              <tbody>
                {tier2.perRep.map((r) => {
                  const flagWords = [
                    r.flags.trunkLeanExceeded ? s.trunkLeanFlag : null,
                    r.flags.partialRom ? s.partialRomFlag : null,
                    r.flags.asymmetry ? s.asymmetryFlag : null,
                  ].filter((w): w is string => w !== null)
                  return (
                    <tr key={r.repIndex}>
                      <th scope="row">{r.repIndex}</th>
                      <td>{r.concentricTimeS.toFixed(2)}</td>
                      <td>{r.peakVelocity.toFixed(2)}</td>
                      <td>{r.meanVelocity.toFixed(2)}</td>
                      <td>{r.romDeg.toFixed(1)}°</td>
                      <td>{r.minAngleDeg.toFixed(1)}°</td>
                      <td>{r.maxAngleDeg.toFixed(1)}°</td>
                      <td>{flagWords.length > 0 ? flagWords.join('、') : '—'}</td>
                      <td>{r.timestampIso}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
