import { describe, expect, it } from 'vitest'

import type { ToolRoute } from '../../src/types/constants/tool-registry.ts'
import { renderRegistry } from './registry.ts'

const route = (overrides: Partial<ToolRoute> & Pick<ToolRoute, 'key'>): ToolRoute => ({
  category: 'Encoding',
  description: 'Encode and decode Base64',
  emoji: '🔤',
  layout: 'codec',
  name: 'Base64 Codec',
  routePath: `/tools/${overrides.key}`,
  seo: { description: 'Base64 online', title: 'Base64 Codec - CSR Dev Tools' },
  ...overrides,
})

describe('renderRegistry', () => {
  it('writes the Tool keys, the table in file order and the opt-out ADR', () => {
    const text = renderRegistry([
      route({ key: 'base64-codec' }),
      route({
        category: 'CSS',
        description: 'Say "hi" \\ back',
        emoji: '✂️',
        key: 'css-grid-playground',
        layout: 'custom',
        layoutOptOutAdr: 'ADR-0027',
        name: 'CSS Grid',
        seo: { description: 'Grid', title: 'Grid Playground' },
      }),
    ])

    expect(text).toContain(
      [
        'pub enum ToolKey {',
        '    Base64Codec,',
        '    CssGridPlayground,',
        '}',
        '',
        'pub(crate) const KEYS: [&str; 2] = [',
        '    "base64-codec",',
        '    "css-grid-playground",',
        '];',
      ].join('\n'),
    )
    expect(text).toContain(
      [
        'pub const TOOLS: [Tool; 2] = [',
        '    Tool {',
        '        key: ToolKey::Base64Codec,',
        '        name: "Base64 Codec",',
        '        category: Category::Encoding,',
        '        emoji: "🔤",',
        '        description: "Encode and decode Base64",',
        '        seo: Seo {',
        '            title: "Base64 Codec - CSR Dev Tools",',
        '            description: "Base64 online",',
        '        },',
        '        layout: Layout::Codec,',
        '        layout_opt_out_adr: None,',
        '    },',
        '    Tool {',
        '        key: ToolKey::CssGridPlayground,',
        '        name: "CSS Grid",',
        '        category: Category::Css,',
        '        emoji: "✂️",',
        '        description: "Say \\"hi\\" \\\\ back",',
        '        seo: Seo {',
        '            title: "Grid Playground",',
        '            description: "Grid",',
        '        },',
        '        layout: Layout::Custom,',
        '        layout_opt_out_adr: Some("ADR-0027"),',
        '    },',
        '];',
      ].join('\n'),
    )
  })

  it('refuses a key that is not lower-case words joined by hyphens', () => {
    for (const key of ['Base64', '9-lives', 'json--diff', 'json_diff', '']) {
      expect(() => renderRegistry([route({ key: key as ToolRoute['key'] })]), key).toThrow(/is not lower-case words/)
    }
  })

  it('refuses two keys that make the same variant', () => {
    expect(() =>
      renderRegistry([route({ key: 'base64-codec' }), route({ key: 'base64-codec' as ToolRoute['key'] })]),
    ).toThrow('Two Tool keys make the variant ToolKey::Base64Codec')
  })
})
