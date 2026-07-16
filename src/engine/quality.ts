import type { Viewport } from './types'

const compactBreakpoint = 760

export function createViewport(element: HTMLElement): Viewport {
  const bounds = element.getBoundingClientRect()
  const compact = bounds.width < compactBreakpoint
  const pixelRatioCap = compact ? 1.25 : 1.5

  return {
    width: Math.max(bounds.width, 1),
    height: Math.max(bounds.height, 1),
    pixelRatio: Math.min(window.devicePixelRatio, pixelRatioCap),
    compact,
  }
}

export function preferredFrameInterval(viewport: Viewport) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 1000 / 30
  return viewport.compact ? 1000 / 50 : 1000 / 60
}
