// The editor bridge (issue 10): CodeMirror runs as plain JS, bundled apart from
// the Dioxus app by Vite and fetched with `import()` the first time an editor
// mounts. Rust talks to it only through `mount` and the returned handle
// (dioxus/app/src/components/code_input.rs), never `document::eval`.
//
// The look copies src/components/common/input/CodeInput.tsx so both builds
// paint the same editor.
import { EditorState } from '@codemirror/state'
import { EditorView, placeholder as placeholderExtension } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup'
import createTheme from '@uiw/codemirror-themes'

const theme = createTheme({
  settings: {
    background: 'var(--color-gray-950)',
    caret: 'var(--color-primary-light)',
    fontFamily: "'Space Mono', monospace",
    foreground: 'var(--color-gray-200)',
    gutterActiveForeground: 'var(--color-gray-300)',
    gutterBackground: 'var(--color-gray-950)',
    gutterBorder: 'var(--color-gray-800)',
    gutterForeground: 'var(--color-gray-600)',
    lineHighlight: 'oklch(0.15 0.008 270 / 0.5)',
    selection: 'oklch(0.55 0.22 310 / 0.5)',
    selectionMatch: 'oklch(0.55 0.22 310 / 0.1)',
  },
  styles: [
    { color: 'var(--color-gray-600)', tag: tags.comment },
    { color: 'var(--color-success)', tag: tags.string },
    { color: 'var(--color-warning)', tag: tags.number },
    { color: 'var(--color-primary-light)', tag: tags.keyword },
    { color: 'var(--color-info)', tag: tags.propertyName },
    { color: 'oklch(0.7 0.15 310)', tag: tags.typeName },
    { color: 'var(--color-warning)', tag: tags.bool },
    { color: 'var(--color-gray-500)', tag: tags.null },
    { color: 'var(--color-gray-400)', tag: tags.operator },
    { color: 'var(--color-gray-400)', tag: tags.bracket },
    { color: 'var(--color-gray-400)', tag: tags.punctuation },
  ],
  theme: 'dark',
})

const baseTheme = EditorView.theme({
  '&': {
    border: '1px solid var(--color-gray-700)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  '&.cm-focused': {
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px oklch(0.55 0.22 310 / 0.15)',
    outline: 'none',
  },
  '.cm-content': { padding: '8px 0' },
  '.cm-gutters': { borderRight: '1px solid var(--color-gray-800)' },
  '.cm-line': { padding: '1.5px 16px 0 12px' },
  '.cm-placeholder': { color: 'var(--color-gray-500)', fontFamily: "'Space Mono', monospace" },
  '.cm-scroller': { fontFamily: "'Space Mono', monospace", lineHeight: '1.625' },
})

export type EditorHandle = {
  destroy: () => void
  setValue: (value: string) => void
}

/**
 * Mounts an editor into `parent`. `onChange` gets the whole document after
 * every user edit; `setValue` replaces it without calling `onChange`.
 * `contentId` / `labelledBy` go on `.cm-content`, the focusable textbox, so the
 * visible `<label>` names it (as FieldForm does for the React CodeInput).
 */
export const mount = (
  parent: HTMLElement,
  doc: string,
  placeholder: string,
  contentId: string,
  labelledBy: string,
  onChange: (value: string) => void,
): EditorHandle => {
  let silent = false
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        basicSetup({
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          searchKeymap: true,
        }),
        theme,
        baseTheme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-labelledby': labelledBy, id: contentId }),
        placeholderExtension(placeholder),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !silent) onChange(update.state.doc.toString())
        }),
      ],
    }),
  })

  return {
    destroy: () => view.destroy(),
    setValue: (value) => {
      if (value === view.state.doc.toString()) return
      silent = true
      view.dispatch({ changes: { from: 0, insert: value, to: view.state.doc.length } })
      silent = false
    },
  }
}
