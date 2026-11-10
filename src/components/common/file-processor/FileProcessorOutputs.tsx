import type {
  FileProcessorAssetCardProps,
  FileProcessorAssetGridProps,
  FileProcessorAssetGroupsProps,
  FileProcessorTextOutputsProps,
} from '@/types'
import { downloadBlob } from '@/utils/download'

import { CopyButton } from '../button'
import { CodeOutput } from '../output'
import { Tabs } from '../tabs'
import { FileThumbnail } from './FileProcessorParts'

const AssetCard = ({ asset }: FileProcessorAssetCardProps) => (
  // raw button: card-style download tile with image content; Button's min-h-8 and motion would distort the grid card layout
  <button
    aria-label={`Download ${asset.name}`}
    className="flex cursor-pointer flex-col items-center gap-1 rounded border border-gray-800 p-2 transition-colors hover:border-gray-600"
    onClick={() => downloadBlob(asset.blob, asset.name)}
    title={`Download ${asset.name}`}
    type="button"
  >
    <span className="bg-grid-texture flex size-18 items-center justify-center rounded p-1">
      <FileThumbnail alt={asset.caption} blob={asset.blob} variant="asset" />
    </span>
    <span className="text-center text-body-xs text-gray-400">{asset.caption}</span>
    {asset.details?.map((line) => (
      <span className="text-center text-body-xs text-gray-500" key={line}>
        {line}
      </span>
    ))}
  </button>
)

const AssetGrid = ({ assets }: FileProcessorAssetGridProps) => (
  <div className="grid grid-cols-3 gap-3 tablet:grid-cols-4 desktop:grid-cols-6">
    {assets.map((asset) => (
      <AssetCard asset={asset} key={asset.zipPath ?? asset.name} />
    ))}
  </div>
)

/** An `assets` result: one group as a plain grid, several as tabs (empty groups are left out). Each card downloads its file. */
export const FileAssetGroups = ({ groups: all }: FileProcessorAssetGroupsProps) => {
  const groups = all.filter((group) => group.assets.length > 0)
  const [only] = groups
  if (groups.length === 1 && only) {
    return (
      <section aria-label={only.label} className="flex flex-col gap-2">
        <p className="text-body-sm font-medium text-gray-300">{only.label}</p>
        <AssetGrid assets={only.assets} />
      </section>
    )
  }
  return (
    <Tabs
      items={groups.map((group) => ({
        content: <AssetGrid assets={group.assets} />,
        // raw button: Radix Tabs trigger — Tabs owns data-state="active" styling, Button would break it
        trigger: <button type="button">{group.label}</button>,
        value: group.label,
      }))}
    />
  )
}

/** Labelled, read-only text blocks with Copy in each label. */
export const FileTextOutputs = ({ outputs }: FileProcessorTextOutputsProps) => (
  <>
    {outputs.map((output) => (
      <div className="flex max-h-72 shrink-0 flex-col" key={output.label}>
        <CodeOutput
          label={
            <span className="flex items-center gap-1">
              <span>{output.label}</span>
              {output.details && <span className="text-body-xs text-gray-500">· {output.details}</span>}
              <CopyButton label={output.label} value={output.value} />
            </span>
          }
          value={output.value}
        />
      </div>
    ))}
  </>
)
