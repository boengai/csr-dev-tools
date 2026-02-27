import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'

import type { CodeInputProps } from '@/types'

import { EditorView } from '@uiw/react-codemirror'

import { tv } from '@/utils'

import { codeInputBaseTheme, codeInputCompactTheme, codeInputTheme } from './code-input-theme'

const wrapperVariants = tv({
  base: 'flex min-h-0 flex-col [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col [&_.cm-editor]:min-h-0 [&_.cm-editor]:flex-1',
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
  block = true,
  disabled = false,
  extensions: externalExtensions,
  height,
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
  const extensions = useMemo(() => {
    const exts = [codeInputBaseTheme, EditorView.lineWrapping, ...(externalExtensions ?? [])]
    if (size === 'compact') {
      exts.push(codeInputCompactTheme)
    }
    return exts
  }, [externalExtensions, size])

  return (
    <div
      aria-label={ariaLabel}
      className={wrapperVariants({ block, disabled })}
      data-testid={`code-input-${name}`}
    >
      <CodeMirror
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          lineNumbers: true,
          searchKeymap: true,
        }}
        editable={!disabled && !readOnly}
        extensions={extensions}
        height={height}
        maxHeight={maxHeight}
        minHeight={minHeight}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        theme={codeInputTheme}
        value={value}
      />
    </div>
  )
}
