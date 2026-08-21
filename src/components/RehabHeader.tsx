
interface RehabHeaderProps {
  streak: number
  onOpenSettings: () => void
  onGoHome?: () => void
}

export function RehabHeader({ streak, onOpenSettings, onGoHome }: RehabHeaderProps) {
  return (
    <header className="rehab-nav">
      <div className="rehab-nav__brand" onClick={onGoHome}>
        <div className="rehab-nav__logo-icon">R</div>
        <div>
          <div className="rehab-nav__title">Shoulder Rehab Coach</div>
          <div className="rehab-nav__subtitle">個人化肩關節復健系統</div>
        </div>
      </div>

      <div className="rehab-nav__actions">
        <div className="rehab-streak-badge" title="連續訓練天數">
          <span>🔥</span>
          <span>{streak} 天連續訓練</span>
        </div>

        <button
          className="rehab-btn-icon"
          onClick={onOpenSettings}
          title="設定訓練參數"
          aria-label="訓練設定"
        >
          ⚙️
        </button>
      </div>
    </header>
  )
}
