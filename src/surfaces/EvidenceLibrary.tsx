import { useT } from '../i18n/LocaleContext'
import {
  EVIDENCE_CLUSTERS,
  PROVENANCE_LABELS,
  localizeEvidence,
  localizeProvenanceLabel,
  type ProvenanceLabel,
} from '../domain/evidenceCatalog'

/**
 * Read-only surface presenting the clinical-evidence provenance record
 * (docs/decisions/rehabibi-clinical-evidence.md) to users and their clinicians.
 * It reports evidence only — it holds no prescription value, changes no logic,
 * and stays strictly on the form-coach side of the medical-device line
 * (invariant 7). All copy is bilingual via the domain `localize*` selectors and
 * the `useT()` chrome table.
 */
export function EvidenceLibrary() {
  const { t, locale } = useT()

  return (
    <div className="evidence-surface">
      {/* Hero */}
      <div className="library-hero">
        <span className="section-tag">
          <span className="section-tag__dot" aria-hidden="true" />
          <span>{t('evidence.tag')}</span>
        </span>
        <h1 className="library-hero__title">{t('evidence.heroTitle')}</h1>
        <p className="library-hero__sub">{t('evidence.heroSub')}</p>
      </div>

      {/* Approach / boundary panel */}
      <section className="evidence-panel" aria-label={t('evidence.approachTitle')}>
        <h2 className="evidence-panel__title">{t('evidence.approachTitle')}</h2>
        <p className="evidence-panel__body">{t('evidence.approachBoundary')}</p>
        <p className="evidence-panel__body">{t('evidence.approachRule')}</p>
        <p className="evidence-panel__body evidence-panel__body--muted">
          {t('evidence.approachPopulation')}
        </p>
      </section>

      {/* Provenance legend */}
      <section className="evidence-legend" aria-label={t('evidence.legendTitle')}>
        <h2 className="library-section__title">{t('evidence.legendTitle')}</h2>
        <p className="library-section__sub">{t('evidence.legendSub')}</p>
        <ul className="evidence-legend__list">
          {PROVENANCE_LABELS.map((meta) => {
            const l = localizeProvenanceLabel(meta.id, locale)
            return (
              <li key={meta.id} className="evidence-legend__item">
                <span className={`prov-chip prov-chip--${meta.id}`}>{l.name}</span>
                <span className="evidence-legend__desc">{l.desc}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Claim clusters */}
      {EVIDENCE_CLUSTERS.map((rawCluster) => {
        const cluster = localizeEvidence(rawCluster, locale)
        return (
          <section key={cluster.id} className="evidence-cluster" aria-label={cluster.title}>
            <h2 className="library-section__title">{cluster.title}</h2>
            <div className="evidence-claim-list">
              {cluster.claims.map((claim) => {
                const l = localizeProvenanceLabel(claim.label as ProvenanceLabel, locale)
                return (
                  <article key={claim.id} className="evidence-claim">
                    <div className="evidence-claim__head">
                      <h3 className="evidence-claim__title">{claim.title}</h3>
                      <span className={`prov-chip prov-chip--${claim.label}`} title={l.desc}>
                        {l.name}
                      </span>
                    </div>

                    <p className="evidence-claim__value">
                      <span className="evidence-claim__value-label">{t('evidence.appValue')}</span>
                      <span>{claim.appValue}</span>
                    </p>

                    <p className="evidence-claim__summary">{claim.summary}</p>

                    {claim.citations.length > 0 && (
                      <ul className="evidence-claim__cites">
                        {claim.citations.map((cite) => (
                          <li key={cite.url} className="evidence-cite">
                            <a
                              className="evidence-cite__link"
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {cite.source}
                              <span aria-hidden="true"> ↗</span>
                            </a>
                            <span className="evidence-cite__pop">
                              {t('evidence.population')}: {cite.population}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Footer / source note */}
      <p className="evidence-footnote">{t('evidence.sourceNote')}</p>
    </div>
  )
}
