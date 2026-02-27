import { tags } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'
import { EditorView } from '@uiw/react-codemirror'

export const codeInputTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'var(--color-gray-950)',
    foreground: 'var(--color-gray-200)',
    caret: 'var(--color-primary-light)',
    selection: 'oklch(0.55 0.22 310 / 0.2)',
    selectionMatch: 'oklch(0.55 0.22 310 / 0.1)',
    lineHighlight: 'oklch(0.15 0.008 270 / 0.5)',
    gutterBackground: 'var(--color-gray-950)',
    gutterForeground: 'var(--color-gray-600)',
    gutterBorder: 'var(--color-gray-800)',
    gutterActiveForeground: 'var(--color-gray-300)',
    fontFamily: "'Space Mono', monospace",
  },
  styles: [
    { tag: tags.comment, color: 'var(--color-gray-600)' },
    { tag: tags.string, color: 'var(--color-success)' },
    { tag: tags.number, color: 'var(--color-warning)' },
    { tag: tags.keyword, color: 'var(--color-primary-light)' },
    { tag: tags.propertyName, color: 'var(--color-info)' },
    { tag: tags.typeName, color: 'oklch(0.7 0.15 310)' },
    { tag: tags.bool, color: 'var(--color-warning)' },
    { tag: tags.null, color: 'var(--color-gray-500)' },
    { tag: tags.operator, color: 'var(--color-gray-400)' },
    { tag: tags.bracket, color: 'var(--color-gray-400)' },
    { tag: tags.punctuation, color: 'var(--color-gray-400)' },
  ],
})

export const codeInputBaseTheme = EditorView.theme({
  '&': {
    fontSize: '0.875rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-gray-800)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px oklch(0.55 0.22 310 / 0.15)',
  },
  '.cm-scroller': {
    fontFamily: "'Space Mono', monospace",
    lineHeight: '1.625',
  },
  '.cm-content': {
    padding: '8px 0',
  },
  '.cm-line': {
    padding: '0 16px 0 12px',
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--color-gray-800)',
  },
  '.cm-placeholder': {
    color: 'var(--color-gray-500)',
    fontFamily: "'Space Mono', monospace",
  },
})

export const codeInputCompactTheme = EditorView.theme({
  '&': {
    fontSize: '0.75rem',
  },
  '.cm-line': {
    padding: '0 8px',
  },
})
