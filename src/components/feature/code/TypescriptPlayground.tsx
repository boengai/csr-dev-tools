import type { EditorProps, Monaco, OnMount, OnValidate } from '@monaco-editor/react'

import Editor from '@monaco-editor/react'
import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { tv } from '@/utils'

type EditorInstance = Parameters<OnMount>[0]
type MarkerData = Parameters<OnValidate>[0][0]

const toolEntry = TOOL_REGISTRY_MAP['typescript-playground']

const SAMPLE_CODE = `type User = {
  name: string
  age: number
  email: string
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`
}

const users: Array<User> = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
]

const messages = users.map(greet)
console.log(messages)
`

const EDITOR_OPTIONS: EditorProps['options'] = {
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  tabSize: 2,
}

const READONLY_EDITOR_OPTIONS: EditorProps['options'] = {
  ...EDITOR_OPTIONS,
  domReadOnly: true,
  readOnly: true,
}

type DiagnosticError = {
  column: number
  line: number
  message: string
  severity: 'error' | 'warning'
}

const severityStyles = tv({
  base: 'shrink-0',
  variants: {
    severity: {
      error: 'text-red-400',
      warning: 'text-yellow-400',
    },
  },
})

const EditorSkeleton = () => (
  <div className="flex h-full w-full animate-pulse items-center justify-center rounded bg-gray-800">
    <span className="text-body-xs text-gray-500">Loading editor...</span>
  </div>
)

export const TypescriptPlayground = (_props: ToolComponentProps) => {
  const [transpiledJs, setTranspiledJs] = useState('')
  const [errors, setErrors] = useState<Array<DiagnosticError>>([])
  const editorRef = useRef<EditorInstance | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const { toast } = useToast()

  const transpileCode = async (editorInstance: EditorInstance, monaco: Monaco) => {
    const model = editorInstance.getModel()
    if (!model) return
    try {
      const worker = await monaco.languages.typescript.getTypeScriptWorker()
      const client = await worker(model.uri)
      const result = await client.getEmitOutput(model.uri.toString())
      setTranspiledJs(result.outputFiles[0]?.text ?? '')
    } catch {
      toast({ action: 'add', item: { label: 'Failed to transpile TypeScript', type: 'error' } })
    }
  }

  const debouncedTranspile = useDebounceCallback(() => {
    if (editorRef.current && monacoRef.current) {
      transpileCode(editorRef.current, monacoRef.current)
    }
  }, 500)

  const handleBeforeMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noEmit: false,
      skipLibCheck: true,
      strict: true,
      target: monaco.languages.typescript.ScriptTarget.ES2022,
    })
  }

  const handleEditorMount = (editorInstance: EditorInstance, monaco: Monaco) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco
    transpileCode(editorInstance, monaco)
  }

  const handleEditorChange = () => {
    debouncedTranspile()
  }

  const handleValidation = (markers: Array<MarkerData>) => {
    if (!monacoRef.current) return
    const severity = monacoRef.current.MarkerSeverity
    setErrors(
      markers
        .filter((m) => m.severity === severity.Error || m.severity === severity.Warning)
        .map((m) => ({
          column: m.startColumn,
          line: m.startLineNumber,
          message: m.message,
          severity: m.severity === severity.Error ? 'error' : 'warning',
        })),
    )
  }

  const errorCount = errors.filter((e) => e.severity === 'error').length
  const warningCount = errors.filter((e) => e.severity === 'warning').length

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        <div aria-label="TypeScript code editor" className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-body-sm font-semibold text-gray-100">TypeScript</h3>
          <div className="md:h-[400px] h-[300px] overflow-hidden rounded border border-gray-800">
            <Editor
              beforeMount={handleBeforeMount}
              defaultLanguage="typescript"
              defaultValue={SAMPLE_CODE}
              height="100%"
              loading={<EditorSkeleton />}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              onValidate={handleValidation}
              options={EDITOR_OPTIONS}
              theme="vs-dark"
            />
          </div>
        </div>

        <div aria-label="JavaScript output (read-only)" className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-body-sm font-semibold text-gray-100">JavaScript</h3>
            <CopyButton label="Copy JS" value={transpiledJs} />
          </div>
          <div className="md:h-[400px] h-[300px] overflow-hidden rounded border border-gray-800">
            <Editor
              defaultLanguage="javascript"
              height="100%"
              loading={<EditorSkeleton />}
              options={READONLY_EDITOR_OPTIONS}
              theme="vs-dark"
              value={transpiledJs}
            />
          </div>
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2" role="status">
        {errors.length > 0 ? (
          <>
            <p className="text-body-xs font-semibold text-gray-300">
              {errorCount > 0 && `${errorCount} error${errorCount !== 1 ? 's' : ''}`}
              {errorCount > 0 && warningCount > 0 && ', '}
              {warningCount > 0 && `${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
            </p>
            <ul className="max-h-40 overflow-y-auto rounded border border-gray-800 bg-gray-950 p-2">
              {errors.map((error, index) => (
                <li
                  aria-label={`${error.severity === 'error' ? 'Error' : 'Warning'} on line ${error.line}: ${error.message}`}
                  className="flex items-start gap-2 px-1 py-0.5 font-mono text-body-xs"
                  key={`${error.line}-${error.column}-${index}`}
                >
                  <span className={severityStyles({ severity: error.severity })}>
                    {error.severity === 'error' ? '●' : '▲'}
                  </span>
                  <span className="shrink-0 text-gray-500">
                    Line {error.line}:{error.column}
                  </span>
                  <span className="text-gray-300">{error.message}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-green-400 text-body-xs">No errors</p>
        )}
      </div>
    </div>
  )
}
