import { useState } from 'react'
import {
  calculateCalendarActivity,
  type DayActivity,
} from '../domain/recoveryMilestones'
import type { CompletedSession } from '../domain/rehabTypes'

interface ActivityCalendarProps {
  history: CompletedSession[]
  selectedDateStr: string | null
  onSelectDate: (dateStr: string | null) => void
}

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'] as const

export function ActivityCalendar({
  history,
  selectedDateStr,
  onSelectDate,
}: ActivityCalendarProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date())

  const calendarData = calculateCalendarActivity(history, viewDate)

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setViewDate(today)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    onSelectDate(todayStr)
  }

  return (
    <section className="activity-calendar" aria-label="訓練與修復月曆">
      {/* Top Header */}
      <div className="activity-calendar__header">
        <div>
          <div className="section-tag">
            <span className="section-tag__dot" style={{ background: 'var(--rehab-orange-deep)' }} aria-hidden="true" />
            <span style={{ color: 'var(--rehab-orange-deep)' }}>訓練與肌腱修復日誌</span>
          </div>
          <h2 className="activity-calendar__title">{calendarData.monthLabelZh}</h2>
        </div>

        <div className="activity-calendar__nav">
          <button
            className="btn btn--glass btn--sm"
            onClick={handlePrevMonth}
            aria-label="上一個月"
          >
            ‹
          </button>
          <button
            className="btn btn--glass btn--sm"
            onClick={handleToday}
            aria-label="回到今天"
          >
            今天
          </button>
          <button
            className="btn btn--glass btn--sm"
            onClick={handleNextMonth}
            aria-label="下一個月"
          >
            ›
          </button>
        </div>
      </div>

      {/* Month Summary Strip */}
      <div className="activity-calendar__summary">
        <div className="cal-stat">
          <span className="cal-stat__icon" aria-hidden="true">🔥</span>
          <div className="cal-stat__content">
            <span className="cal-stat__val cal-stat__val--orange">
              {calendarData.currentStreak} <span className="cal-stat__unit">天</span>
            </span>
            <span className="cal-stat__label">連續訓練</span>
          </div>
        </div>
        <div className="cal-stat">
          <span className="cal-stat__icon" aria-hidden="true">📅</span>
          <div className="cal-stat__content">
            <span className="cal-stat__val cal-stat__val--blue">
              {calendarData.activeDaysCount} <span className="cal-stat__unit">天</span>
            </span>
            <span className="cal-stat__label">訓練天數</span>
          </div>
        </div>
        <div className="cal-stat">
          <span className="cal-stat__icon" aria-hidden="true">🎯</span>
          <div className="cal-stat__content">
            <span className="cal-stat__val cal-stat__val--green">
              {calendarData.totalRepsThisMonth} <span className="cal-stat__unit">次</span>
            </span>
            <span className="cal-stat__label">累計動作</span>
          </div>
        </div>
        <div className="cal-stat">
          <span className="cal-stat__icon" aria-hidden="true">🌱</span>
          <div className="cal-stat__content">
            <span className="cal-stat__val cal-stat__val--rest">
              {calendarData.restDaysCount} <span className="cal-stat__unit">天</span>
            </span>
            <span className="cal-stat__label">肌腱修復</span>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="activity-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS_ZH.map((w, idx) => (
          <div
            key={w}
            className={`activity-calendar__weekday ${
              idx === 0 || idx === 6 ? 'activity-calendar__weekday--weekend' : ''
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="activity-calendar__grid" role="grid">
        {calendarData.days.map((day: DayActivity) => {
          const isSelected = selectedDateStr === day.dateStr
          const hasSessions = day.sessionsCount > 0

          let cellModifier = ''
          if (!day.isCurrentMonth) cellModifier += ' cal-day--outside'
          if (day.isToday) cellModifier += ' cal-day--today'
          if (isSelected) cellModifier += ' cal-day--selected'
          if (hasSessions) cellModifier += ' cal-day--active'
          if (day.isRestDay) cellModifier += ' cal-day--rest'

          return (
            <button
              key={day.dateStr}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              disabled={day.isFuture}
              className={`cal-day ${cellModifier}`}
              onClick={() => {
                if (isSelected) {
                  onSelectDate(null) // toggle deselect
                } else {
                  onSelectDate(day.dateStr)
                }
              }}
            >
              <div className="cal-day__header">
                <span className="cal-day__number">{day.dayNumber}</span>
                {day.isToday && <span className="cal-day__today-badge">今</span>}
              </div>

              <div className="cal-day__body">
                {hasSessions ? (
                  <div className="cal-day__activity">
                    <span className="cal-day__reps-badge">{day.totalReps}次</span>
                    <span className="cal-day__dots" aria-hidden="true">
                      {Array.from({ length: Math.min(3, day.sessionsCount) }).map((_, i) => (
                        <span key={i} className="cal-day__dot" />
                      ))}
                    </span>
                  </div>
                ) : day.isRestDay ? (
                  <div className="cal-day__rest-badge" title="肌腱修復日">
                    <span className="cal-day__rest-icon" aria-hidden="true">🌱</span>
                    <span className="cal-day__rest-label">修復</span>
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* Calendar Legend */}
      <div className="activity-calendar__legend">
        <div className="legend-item">
          <span className="legend-dot legend-dot--active" />
          <span>完成訓練</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot--rest" />
          <span>肌腱修復日</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot--today" />
          <span>今日</span>
        </div>
        {selectedDateStr && (
          <button
            className="btn btn--quiet btn--sm"
            onClick={() => onSelectDate(null)}
            style={{ marginLeft: 'auto', fontSize: '12px' }}
          >
            ✕ 清除篩選 ({selectedDateStr})
          </button>
        )}
      </div>
    </section>
  )
}
