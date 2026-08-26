import { useT } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/locale'
import { RehabLogo } from './RehabLogo'

interface RehabHeaderProps {
  activeTab: 'dashboard' | 'exercises' | 'prescriptions'
  onSelectTab: (tab: 'dashboard' | 'exercises' | 'prescriptions') => void
  streak: number
  onOpenSettings: () => void
  onGoHome?: () => void
}

export function RehabHeader({
  activeTab,
  onSelectTab,
  streak,
  onOpenSettings,
  onGoHome,
}: RehabHeaderProps) {
  const { t, locale, setLocale } = useT()

  return (
    <header className="rehab-nav">
      {/* Brand */}
      <button
        className="rehab-nav__brand"
        onClick={() => {
          onSelectTab('dashboard')
          if (onGoHome) onGoHome()
        }}
        aria-label={t('nav.backHome')}
      >
        <RehabLogo variant="icon" size={34} />
        <span>
          <span className="rehab-nav__title">Rehabibi</span>
          <span className="rehab-nav__subtitle">{t('nav.subtitle')}</span>
        </span>
      </button>

      {/* Primary Navigation Tabs */}
      <nav className="rehab-nav__tabs" aria-label={t('nav.tabsAria')}>
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'nav-tab--active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          aria-selected={activeTab === 'dashboard'}
          role="tab"
        >
          <span>{t('nav.dashboard')}</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'exercises' ? 'nav-tab--active' : ''}`}
          onClick={() => onSelectTab('exercises')}
          aria-selected={activeTab === 'exercises'}
          role="tab"
        >
          <span>{t('nav.exercises')}</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'prescriptions' ? 'nav-tab--active' : ''}`}
          onClick={() => onSelectTab('prescriptions')}
          aria-selected={activeTab === 'prescriptions'}
          role="tab"
        >
          <span>{t('nav.prescriptions')}</span>
        </button>
      </nav>

      {/* Actions */}
      <div className="rehab-nav__actions">
        {/* Language toggle — a quick, always-visible 中 / EN switch. */}
        <div className="lang-toggle" role="group" aria-label={t('nav.language')}>
          {(['zh', 'en'] as const).map((code: Locale) => (
            <button
              key={code}
              type="button"
              className={`lang-toggle__opt ${locale === code ? 'lang-toggle__opt--active' : ''}`}
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
            >
              {code === 'zh' ? '中' : 'EN'}
            </button>
          ))}
        </div>

        <span className="streak-badge" title={t('nav.streakTitle')}>
          <span className="section-tag__dot" aria-hidden="true" />
          <span>{t('nav.streakDays', { n: streak })}</span>
        </span>

        <button
          className="btn btn--glass btn--icon"
          onClick={onOpenSettings}
          aria-label={t('nav.settings')}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor" strokeWidth="1.7"
            />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
