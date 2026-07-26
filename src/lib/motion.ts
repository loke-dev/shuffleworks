export function visualDelay(durationMs: number) {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : durationMs
}
