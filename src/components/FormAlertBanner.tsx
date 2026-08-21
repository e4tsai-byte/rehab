import type { FormFlag } from '../domain/rehabTypes'

interface FormAlertBannerProps {
  flags: readonly FormFlag[]
}

const FLAG_MESSAGES: Record<FormFlag, { title: string; hint: string }> = {
  SHOULDER_HIKE: {
    title: '右肩聳起',
    hint: '請放鬆右側肩膀，避免聳肩代償',
  },
  TORSO_LEAN: {
    title: '身體傾斜',
    hint: '請保持軀幹直立，避免後仰或側傾',
  },
  ELBOW_BENT: {
    title: '手臂彎曲',
    hint: '請將手肘伸直，維持手臂直線',
  },
  RUSHED_CONCENTRIC: {
    title: '抬起過快',
    hint: '請配合節奏，以 5 秒緩慢平舉',
  },
  RUSHED_ECCENTRIC: {
    title: '下放過快',
    hint: '請控制肌肉，以 5 秒緩慢放下',
  },
  INCOMPLETE_HOLD: {
    title: '停頓未達 5 秒',
    hint: '請在 90° 水平位置維持穩定停頓',
  },
}

export function FormAlertBanner({ flags }: FormAlertBannerProps) {
  if (flags.length === 0) return null

  return (
    <div className="form-alert" role="alert" aria-live="assertive">
      {flags.map((flag) => {
        const msg = FLAG_MESSAGES[flag]
        if (!msg) return null
        return (
          <div key={flag} className="form-alert__item">
            <span className="form-alert__badge">姿勢注意</span>
            <span className="form-alert__title">{msg.title}：</span>
            <span className="form-alert__hint">{msg.hint}</span>
          </div>
        )
      })}
    </div>
  )
}
