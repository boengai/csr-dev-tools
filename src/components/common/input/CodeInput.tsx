import { tags } from '@lezer/highlight'
import createTheme from '@uiw/codemirror-themes'
import CodeMirror, { type BasicSetupOptions, EditorView } from '@uiw/react-codemirror'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { CodeInputProps } from '@/types'
import { tv } from '@/utils'

const codeInputTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'var(--color-gray-950)',
    foreground: 'var(--color-gray-200)',
    caret: 'var(--color-primary-light)',
    selection: 'oklch(0.55 0.22 310 / 0.5)',
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

const codeInputBaseTheme = EditorView.theme({
  '&': {
    fontSize: '0.875rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-gray-700)',
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
    padding: '1.5px 16px 0 12px',
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--color-gray-800)',
  },
  '.cm-placeholder': {
    color: 'var(--color-gray-500)',
    fontFamily: "'Space Mono', monospace",
  },
})

const codeInputCompactTheme = EditorView.theme({
  '&': {
    fontSize: '0.75rem',
  },
  '.cm-line': {
    padding: '0 8px',
  },
})

// Module-level so @uiw/react-codemirror sees a stable `basicSetup` identity —
// an inline object would dispatch `StateEffect.reconfigure` on every render.
const editableBasicSetup: BasicSetupOptions = {
  bracketMatching: true,
  closeBrackets: true,
  foldGutter: false,
  highlightActiveLine: true,
  highlightActiveLineGutter: true,
  lineNumbers: true,
  searchKeymap: true,
}

const readOnlyBasicSetup: BasicSetupOptions = {
  ...editableBasicSetup,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
}

const isShallowEqual = <T,>(a: ReadonlyArray<T> | undefined, b: ReadonlyArray<T> | undefined): boolean => {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((item, index) => Object.is(item, b[index]))
}

/** Keeps the previous array identity while its elements are unchanged, so inline `extensions={[x]}` doesn't reconfigure. */
const useShallowStableArray = <T,>(next: Array<T> | undefined): Array<T> | undefined => {
  const [stable, setStable] = useState(next)
  if (!isShallowEqual(stable, next)) {
    setStable(next)
    return next
  }
  return stable
}

const wrapperVariants = tv({
  base: 'flex max-h-[90dvh] min-h-0 flex-col overflow-scroll [&_.cm-editor]:min-h-0 [&_.cm-editor]:flex-1 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col',
  variants: {
    block: {
      true: 'w-full grow',
      false: '',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: '',
    },
  },
  defaultVariants: {
    block: true,
    disabled: false,
  },
})

export const CodeInput = ({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  block = true,
  disabled = false,
  extensions: externalExtensions,
  height,
  id,
  maxHeight,
  minHeight,
  name,
  onBlur,
  onChange,
  placeholder,
  readOnly = false,
  size = 'default',
  value = '',
}: CodeInputProps) => {
  const stableExternalExtensions = useShallowStableArray(externalExtensions)

  // Latest-ref wrapper: CodeMirror gets one stable `onChange` for the
  // component's lifetime, while still calling the newest parent callback.
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
  })
  const handleChange = useCallback((next: string) => onChangeRef.current?.(next), [])

  const extensions = useMemo(() => {
    // `.cm-content` is the focusable textbox, so the accessible name and the
    // `<label htmlFor>` target id belong there rather than on the wrapper div.
    const contentAttributes: Record<string, string> = {}
    if (id) contentAttributes.id = id
    if (ariaLabel) contentAttributes['aria-label'] = ariaLabel
    if (ariaLabelledBy) contentAttributes['aria-labelledby'] = ariaLabelledBy

    const exts = [
      codeInputBaseTheme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of(contentAttributes),
      ...(stableExternalExtensions ?? []),
    ]
    if (size === 'compact') {
      exts.push(codeInputCompactTheme)
    }
    return exts
  }, [ariaLabel, ariaLabelledBy, id, size, stableExternalExtensions])

  return (
    <div className={wrapperVariants({ block, disabled })} data-testid={`code-input-${name}`}>
      <CodeMirror
        basicSetup={readOnly ? readOnlyBasicSetup : editableBasicSetup}
        editable={!disabled && !readOnly}
        extensions={extensions}
        height={height}
        maxHeight={maxHeight}
        minHeight={minHeight}
        onBlur={onBlur}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        theme={codeInputTheme}
        value={value}
      />
    </div>
  )
}
