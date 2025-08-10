import type { ReactNode } from 'react'

export type DataCellTableProps = {
  rows: Array<{ label: ReactNode; render?: (val: string) => ReactNode; value: string }>
}
