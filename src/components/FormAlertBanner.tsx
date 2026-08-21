import type { FormFlag } from '../domain/rehabTypes'

interface FormAlertBannerProps {
  flags: readonly FormFlag[]
}

/* Instruction, never verdict. The user already knows the movement was hard;
   what they do not know is what to do about it in the next two seconds.
   「肩膀放鬆下沉」, not 「你聳肩了」. CLAUDE.md invariant 1.6. */
const FLAG_MESSAGES: Record<FormFlag, { title: string; hint: string }> = {
  SHOULDER_HIKE: { title: '肩膀放鬆下沉', hint: '右肩往下沉，讓手臂自己出力' },
  TORSO_LEAN: { title: '軀幹保持直立', hint: '身體回到中線，不要後仰借力' },
  ELBOW_BENT: { title: '手肘伸直', hint: '維持手臂成一直線' },
  PACING_TOO_FAST: { title: '放慢速度', hint: '配合 5 秒節奏平穩移動' },
  PACING_TOO_SLOW: { title: '稍微加快', hint: '配合 5 秒節奏平穩移動' },
  RUSHED_CONCENTRIC: { title: '抬起放慢', hint: '以 5 秒緩慢平舉' },
  RUSHED_ECCENTRIC: { title: '下放放慢', hint: '以 5 秒緩慢控制放下' },
  INCOMPLETE_HOLD: { title: '停頓再久一點', hint: '在水平位置維持穩定' },
}

export function FormAlertBanner({ flags }: FormAlertBannerProps) {
  if (flags.length === 0) return null

  // Two at once is the ceiling. A stream of simultaneous corrections is not
  // actionable within a rep, and reads as a list of accusations.
  const uniqueFlags = Array.from(new Set(flags)).slice(0, 2)

  return (
    <div className="form-alert" role="alert" aria-live="assertive">
      {uniqueFlags.map((flag) => {
        const msg = FLAG_MESSAGES[flag]
        if (!msg) return null
        return (
          <div key={flag} className="form-alert__item">
            <span className="form-alert__title">{msg.title}</span>
            <span className="form-alert__hint">{msg.hint}</span>
          </div>
        )
      })}
    </div>
  )
}
