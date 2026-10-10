import type { PwaIconResult, SplashScreenResult } from '@/types/utils/splash-screen'

export type SplashPreviewCardProps = { onDownload: () => void; splash: SplashScreenResult }

export type IconPreviewCardProps = { icon: PwaIconResult; onDownload: () => void }
