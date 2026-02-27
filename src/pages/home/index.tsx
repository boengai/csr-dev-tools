import { motion } from 'motion/react'
import { type ButtonHTMLAttributes, Suspense, useMemo, useState } from 'react'

import type { ToolRegistryKey } from '@/types'

import { Card, Dialog, NotoEmoji, PlusIcon } from '@/components'
import { CATEGORY_ORDER, groupToolsByCategory, TOOL_REGISTRY, TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, usePersistFeatureLayout } from '@/hooks'

const AddButton = ({ onClick }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) => {
  return (
    <motion.button
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="[&>svg]:align-center flex size-full items-center justify-center rounded-card border-3 border-dashed"
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{
        borderColor: 'var(--color-gray-800)',
        color: 'var(--color-gray-800)',
        opacity: 0,
        scale: 0.95,
        y: 10,
      }}
      onClick={onClick}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        borderColor: 'var(--color-primary)',
        color: 'var(--color-primary)',
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -4,
      }}
    >
      <PlusIcon size={120} />
    </motion.button>
  )
}

const AppContainer = ({ onOpenDialog, position }: { onOpenDialog: (position: number) => void; position: number }) => {
  //hook
  const { setter, value } = usePersistFeatureLayout()

  const handleClose = () => {
    setter(position, null)
  }

  const registryKey = value[position]
  if (registryKey) {
    const entry = TOOL_REGISTRY_MAP[registryKey]
    if (entry) {
      const ToolComponent = entry.component
      return (
        <Card onClose={handleClose} title={entry.name}>
          <ToolComponent />
        </Card>
      )
    }
  }
  return <AddButton onClick={() => onOpenDialog(position)} />
}

const AppLoading = () => {
  return (
    <div className="flex grow flex-col items-center justify-center rounded-card bg-primary/10">
      <NotoEmoji emoji="robot" size={120} />
    </div>
  )
}

const SelectAppDialog = ({ onDismiss, position }: { onDismiss: () => void; position: null | number }) => {
  const { setter, value } = usePersistFeatureLayout()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debouncedSetSearch = useDebounceCallback(setDebouncedSearch, 200)

  const appPosition = Object.entries(value).reduce((acc: Record<string, number>, cur) => {
    if (cur[1] !== null) {
      acc[cur[1]] = Number(cur[0])
    }
    return acc
  }, {})

  const groupedTools = useMemo(() => groupToolsByCategory(TOOL_REGISTRY), [])

  const filteredGroupedTools = useMemo(() => {
    if (!debouncedSearch.trim()) return groupedTools
    const query = debouncedSearch.toLowerCase()
    const filtered: typeof groupedTools = {}
    for (const [category, tools] of Object.entries(groupedTools)) {
      const matched = tools.filter(
        (t) => t.name.toLowerCase().includes(query) || t.key.toLowerCase().includes(query),
      )
      if (matched.length > 0) filtered[category] = matched
    }
    return filtered
  }, [groupedTools, debouncedSearch])

  const handleSelectApp = (value: ToolRegistryKey) => {
    if (position !== null) {
      setter(position, value)
      onDismiss()
    }
  }

  return (
    <Dialog
      injected={{ open: position !== null, setOpen: onDismiss }}
      title={`Select App for Widget#${position !== null ? position + 1 : ''}`}
    >
      <div className="mb-4">
        <input
          autoFocus
          className="w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-body-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
          onChange={(e) => {
            setSearch(e.target.value)
            debouncedSetSearch(e.target.value)
          }}
          placeholder="Search tools..."
          type="text"
          value={search}
        />
      </div>
      {CATEGORY_ORDER.some((cat) => filteredGroupedTools[cat]) ? (
        <div className="columns-1 gap-x-6 tablet:columns-2 laptop:columns-3">
          {CATEGORY_ORDER.filter((cat) => filteredGroupedTools[cat]).map((category) => (
            <div className="mb-4 break-inside-avoid" key={category}>
              <span className="block px-2 pb-1 text-[0.6rem] tracking-[0.12em] text-gray-500 uppercase">{category}</span>
              <ul className="flex flex-col gap-1">
                {filteredGroupedTools[category].map((entry) => {
                  const at = appPosition[entry.key] ?? null
                  return (
                    <li key={entry.key}>
                      <button
                        className="flex w-full cursor-pointer items-center justify-between rounded p-2 text-left hover:bg-primary/30 disabled:pointer-events-none disabled:opacity-50"
                        disabled={at !== null}
                        onClick={() => handleSelectApp(entry.key)}
                      >
                        <span>
                          <span className="mr-2">{entry.emoji}</span>
                          {entry.name}
                        </span>
                        {at !== null && <span className="text-xs rounded bg-secondary px-1 text-white">#{at + 1}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-body-sm text-gray-500">No tools found for "{debouncedSearch}"</p>
      )}
    </Dialog>
  )
}

export default function HomePage() {
  const [selectedWidget, setSelectedWidget] = useState<null | number>(null)
  const handleCloseDialog = () => {
    setSelectedWidget(null)
  }

  return (
    <>
      <div className="flex grow flex-wrap gap-6 p-6 pb-[calc(1.5rem+var(--safe-area-inset-bottom))]">
        {Array.from({ length: 6 }).map((_, idx) => (
          <section
            className="flex aspect-2/3 w-full flex-col tablet:w-[calc(100%/2-1rem)] laptop:aspect-auto laptop:h-[calc(50dvh-3.75rem)] laptop:w-[calc(100%/3-1rem)]"
            key={`${idx}`}
          >
            <Suspense fallback={<AppLoading />}>
              <AppContainer onOpenDialog={setSelectedWidget} position={idx} />
            </Suspense>
          </section>
        ))}
      </div>
      <SelectAppDialog onDismiss={handleCloseDialog} position={selectedWidget} />
    </>
  )
}
