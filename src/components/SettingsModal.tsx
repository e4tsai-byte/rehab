import { useState } from 'react'
import type { UserSettings } from '../domain/rehabTypes'

interface SettingsModalProps {
  settings: UserSettings
  onSave: (newSettings: UserSettings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<UserSettings>({ ...settings })

  function handleSave() {
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>復健動作參數設定</h3>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Target Angle Slider */}
        <div className="setting-row">
          <div className="setting-row__header">
            <span>目標抬起角度</span>
            <span style={{ color: '#38bdf8' }}>{form.targetAngleDeg}°</span>
          </div>
          <input
            type="range"
            min="60"
            max="120"
            step="5"
            value={form.targetAngleDeg}
            onChange={(e) => setForm({ ...form, targetAngleDeg: Number(e.target)/1 || Number(e.target.value) })}
          />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            標準肩關節平舉目標為 90°
          </span>
        </div>

        {/* Hold Duration Slider */}
        <div className="setting-row">
          <div className="setting-row__header">
            <span>頂點等長停頓時間</span>
            <span style={{ color: '#38bdf8' }}>{form.holdDurationS} 秒</span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={form.holdDurationS}
            onChange={(e) => setForm({ ...form, holdDurationS: Number(e.target.value) })}
          />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            醫生處方一般為 3 至 5 秒穩定停頓
          </span>
        </div>

        {/* Reps per Set */}
        <div className="setting-row">
          <div className="setting-row__header">
            <span>每組訓練次數</span>
            <span style={{ color: '#38bdf8' }}>{form.targetReps} 次</span>
          </div>
          <input
            type="range"
            min="5"
            max="15"
            step="1"
            value={form.targetReps}
            onChange={(e) => setForm({ ...form, targetReps: Number(e.target.value) })}
          />
        </div>

        {/* Audio Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>語音 / 提示音效</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>到位與完成時播放提示音</div>
          </div>
          <input
            type="checkbox"
            checked={form.soundEnabled}
            onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
            style={{ width: '20px', height: '20px', accentColor: '#38bdf8' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--rehab-border)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={handleSave}
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  )
}
