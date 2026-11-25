export type Throttle = { cpuSlowdown: number; downloadKbps: number; latencyMs: number; uploadKbps: number }

// Lighthouse's `mobileSlow4G` and `desktopDense4G`, in the form DevTools applies: latency is 3.75 x the round trip
// and throughput is 0.9 x the nominal rate. Lighthouse ships the applied form of the first only.
export const SLOW_4G: Throttle = { cpuSlowdown: 4, downloadKbps: 1474.56, latencyMs: 562.5, uploadKbps: 675 }
export const DENSE_4G: Throttle = { cpuSlowdown: 1, downloadKbps: 9216, latencyMs: 150, uploadKbps: 9216 }
