import type { SplashScreenDevice } from '@/types/constants/splash-screen'

export const IOS_DEVICES: Array<SplashScreenDevice> = [
  // iPhones
  { category: 'iphone', height: 2868, name: 'iPhone 17 Pro Max', scaleFactor: 3, width: 1320 },
  { category: 'iphone', height: 2622, name: 'iPhone 17 Pro', scaleFactor: 3, width: 1206 },
  { category: 'iphone', height: 2796, name: 'iPhone 17', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2796, name: 'iPhone 17 Air', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2796, name: 'iPhone 16 Pro Max', scaleFactor: 3, width: 1320 },
  { category: 'iphone', height: 2622, name: 'iPhone 16 Pro', scaleFactor: 3, width: 1206 },
  { category: 'iphone', height: 2796, name: 'iPhone 16', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2778, name: 'iPhone 16 Plus', scaleFactor: 3, width: 1284 },
  { category: 'iphone', height: 2796, name: 'iPhone 15 Pro Max', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2556, name: 'iPhone 15 Pro', scaleFactor: 3, width: 1179 },
  { category: 'iphone', height: 2532, name: 'iPhone 15', scaleFactor: 3, width: 1170 },
  { category: 'iphone', height: 2796, name: 'iPhone 14 Pro Max', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2556, name: 'iPhone 14 Pro', scaleFactor: 3, width: 1179 },
  { category: 'iphone', height: 2532, name: 'iPhone 14', scaleFactor: 3, width: 1170 },
  { category: 'iphone', height: 2796, name: 'iPhone SE 4th gen', scaleFactor: 3, width: 1290 },
  { category: 'iphone', height: 2340, name: 'iPhone 13 mini', scaleFactor: 3, width: 1080 },
  { category: 'iphone', height: 2340, name: 'iPhone 12 mini', scaleFactor: 3, width: 1080 },
  { category: 'iphone', height: 1334, name: 'iPhone 8', scaleFactor: 2, width: 750 },
  { category: 'iphone', height: 1334, name: 'iPhone SE', scaleFactor: 2, width: 750 },
  { category: 'iphone', height: 2208, name: 'iPhone 8 Plus', scaleFactor: 3, width: 1242 },

  // iPads
  { category: 'ipad', height: 2732, name: 'iPad Pro 12.9"', scaleFactor: 2, width: 2048 },
  { category: 'ipad', height: 2388, name: 'iPad Pro 11"', scaleFactor: 2, width: 1668 },
  { category: 'ipad', height: 2360, name: 'iPad Air 10.9"', scaleFactor: 2, width: 1640 },
  { category: 'ipad', height: 2160, name: 'iPad 10.2"', scaleFactor: 2, width: 1620 },
  { category: 'ipad', height: 2266, name: 'iPad mini 8.3"', scaleFactor: 2, width: 1488 },
]

export const PWA_ICON_SIZES = [48, 72, 96, 128, 144, 192, 384, 512] as const

export const MASKABLE_ICON_SIZES = [192, 512] as const

export const MASKABLE_SAFE_ZONE_RATIO = 0.8

export type { SplashScreenDevice } from '@/types/constants/splash-screen'
