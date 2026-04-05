import type { GradientConfig, GradientStop } from '@/utils'

export type GradientStopWithId = GradientStop & { _id: number }

export type LocalConfig = Omit<GradientConfig, 'stops'> & { stops: Array<GradientStopWithId> }
