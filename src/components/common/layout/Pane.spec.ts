import { describe, expect, it } from 'vitest'

import { paneStyles } from './Pane'

describe('paneStyles', () => {
  const invariants = ['flex', 'min-h-0', 'min-w-0', 'flex-1', 'flex-col']

  it('applies the min-h-0 min-w-0 envelope unconditionally', () => {
    const classes = paneStyles({}).split(' ')
    for (const cls of invariants) expect(classes).toContain(cls)
  })

  it('applies the same envelope across every gap / align / justify / scroll combination', () => {
    const combos = [
      paneStyles({ gap: 'sm' }),
      paneStyles({ gap: 'md' }),
      paneStyles({ gap: 'lg' }),
      paneStyles({ align: 'center' }),
      paneStyles({ justify: 'center' }),
      paneStyles({ scroll: true }),
      paneStyles({ align: 'center', gap: 'lg', justify: 'center', scroll: true }),
    ]
    for (const result of combos) {
      const classes = result.split(' ')
      for (const cls of invariants) expect(classes).toContain(cls)
    }
  })

  it('defaults gap to sm (gap-2)', () => {
    expect(paneStyles({}).split(' ')).toContain('gap-2')
  })

  it('maps gap=md to gap-3 and gap=lg to gap-4', () => {
    expect(paneStyles({ gap: 'md' }).split(' ')).toContain('gap-3')
    expect(paneStyles({ gap: 'lg' }).split(' ')).toContain('gap-4')
  })

  it('adds items-center when align=center, omits it for align=start', () => {
    expect(paneStyles({ align: 'center' }).split(' ')).toContain('items-center')
    expect(paneStyles({ align: 'start' }).split(' ')).not.toContain('items-center')
  })

  it('adds justify-center when justify=center, omits it for justify=start', () => {
    expect(paneStyles({ justify: 'center' }).split(' ')).toContain('justify-center')
    expect(paneStyles({ justify: 'start' }).split(' ')).not.toContain('justify-center')
    expect(paneStyles({}).split(' ')).not.toContain('justify-center')
  })

  it('adds overflow-y-auto when scroll=true, omits it otherwise', () => {
    expect(paneStyles({ scroll: true }).split(' ')).toContain('overflow-y-auto')
    expect(paneStyles({ scroll: false }).split(' ')).not.toContain('overflow-y-auto')
    expect(paneStyles({}).split(' ')).not.toContain('overflow-y-auto')
  })
})
