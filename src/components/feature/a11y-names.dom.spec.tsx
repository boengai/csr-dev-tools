/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import type { ToolComponentProps } from '@/types'

import { ColorPaletteGenerator } from './color/ColorPaletteGenerator'
import { FlexboxPlayground } from './css/FlexboxPlayground'
import { GradientGenerator } from './css/GradientGenerator'
import { PlaceholderImageGenerator } from './image/PlaceholderImageGenerator'
import { TimezoneConverter } from './time/TimezoneConverter'

const ROLES = ['combobox', 'radiogroup', 'slider', 'spinbutton', 'textbox'] as const

const TOOLS: Array<[string, ComponentType<ToolComponentProps>]> = [
  ['ColorPaletteGenerator', ColorPaletteGenerator],
  ['FlexboxPlayground', FlexboxPlayground],
  ['GradientGenerator', GradientGenerator],
  ['PlaceholderImageGenerator', PlaceholderImageGenerator],
  ['TimezoneConverter', TimezoneConverter],
]

describe('standalone form controls expose an accessible name', () => {
  beforeAll(() => {
    // Radix Slider measures its thumb; jsdom has no ResizeObserver.
    globalThis.ResizeObserver ??= class {
      disconnect() {}
      observe() {}
      unobserve() {}
    }
  })

  it.each(TOOLS)('%s', async (_name, Tool) => {
    render(<Tool autoOpen />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())

    const controls = ROLES.flatMap((role) => screen.queryAllByRole(role))
    expect(controls.length).toBeGreaterThan(0)

    const unnamed = ROLES.flatMap((role) => screen.queryAllByRole(role, { name: '' }))
    expect(unnamed.map((el) => el.outerHTML.slice(0, 120))).toEqual([])
  })
})
