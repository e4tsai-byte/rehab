interface RehabHeaderProps {
  streak: number
  onOpenSettings: () => void
  onGoHome?: () => void
}

export function RehabHeader({ streak, onOpenSettings, onGoHome }: RehabHeaderProps) {
  return (
    <header className="rehab-nav">
      <button className="rehab-nav__brand" onClick={onGoHome} aria-label="回到首頁">
        <span className="rehab-nav__logo" aria-hidden="true">R</span>
        <span>
          <span className="rehab-nav__title">Rehabibi</span>
          <span className="rehab-nav__subtitle">肩關節復健教練</span>
        </span>
      </button>

      <div className="rehab-nav__actions">
        <span className="streak-badge" title="連續訓練天數">
          <span aria-hidden="true">🔥</span>
          <span>{streak} 天</span>
        </span>

        <button
          className="btn btn--glass btn--icon"
          onClick={onOpenSettings}
          aria-label="訓練設定"
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
