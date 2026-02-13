import type { CompVariant, ToolLayoutProps, ToolLayoutVariants } from '@/types'

import { tv } from '@/utils'

const toolLayoutVariants: CompVariant<ToolLayoutVariants> = tv({
  base: 'flex size-full grow flex-col',
  variants: {
    mode: {
      card: 'gap-2',
      page: 'gap-4',
    },
  },
})

export const ToolLayout = ({ actions, description, error, input, mode, output, title }: ToolLayoutProps) => {
  const className = toolLayoutVariants({ mode })

  return (
    <section aria-description={description} aria-label={title} className={className}>
      {mode === 'card' && description && <p className="text-body-xs text-gray-500">{description}</p>}

      {mode === 'page' && (
        <div className="shrink-0">
          <h2 className="text-heading-5">{title}</h2>
          <p className="text-body-sm text-gray-400">{description}</p>
        </div>
      )}

      <div className="flex min-h-0 grow flex-col gap-2">
        <div className="min-h-0 grow">{input}</div>

        {error != null && (
          <p className="text-error text-body-sm shrink-0" role="alert">
            {error}
          </p>
        )}
      </div>

      {output != null && <div className="min-h-0 grow">{output}</div>}

      {actions != null && (
        <div className="max-tablet:w-full max-tablet:flex-col max-tablet:[&>*]:min-h-11 max-tablet:[&>*]:min-w-11 tablet:justify-end flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </section>
  )
}
