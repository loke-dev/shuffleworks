import type { ShuffleResult } from '../engine/types'

export type AppShell = {
  canvas: HTMLCanvasElement
  setReady: () => void
  setShuffling: (active: boolean) => void
  renderResult: (result: ShuffleResult) => void
  onShuffle: (handler: () => void) => void
}
