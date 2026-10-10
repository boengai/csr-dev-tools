import type { KindBadgeProps } from '@/types'
import { cnMerge } from '@/utils'

/**
 * Small square glyph identifying a schema entry's kind (message/enum, object/
 * union, …). Each schema browser passes its own kind → style map.
 */
export const KindBadge = <K extends string>({ ariaLabel, kind, styles }: KindBadgeProps<K>) => {
  const style = styles[kind]
  return (
    <span
      aria-label={ariaLabel}
      className={cnMerge(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[10px] font-bold',
        style.badge,
      )}
    >
      {style.label}
    </span>
  )
}
