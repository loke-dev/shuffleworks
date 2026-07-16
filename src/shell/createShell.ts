import type { ShuffleResult } from '../engine/types'
import { renderResultMarkup } from './resultView'
import { createAppMarkup } from './template'
import type { AppShell } from './types'

export function createShell(root: HTMLElement): AppShell {
  root.innerHTML = createAppMarkup(new Date().getFullYear())

  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-shuffle]')]
  const resultGrid = root.querySelector<HTMLElement>('.result-grid')!
  const announcement = root.querySelector<HTMLElement>('[data-announcement]')!
  const count = root.querySelector<HTMLElement>('.draw-count b')!
  const shuffleLabel = root.querySelector<HTMLElement>('.shuffle span')!
  let drawCount = 0

  return {
    canvas,
    setReady() { root.classList.add('is-ready') },
    setShuffling(active) {
      root.classList.toggle('is-shuffling', active)
      buttons.forEach((button) => { button.disabled = active })
      shuffleLabel.textContent = active ? 'Colors in flight…' : 'Shuffle spectrum'
    },
    renderResult(result: ShuffleResult) {
      drawCount += 1
      count.textContent = String(drawCount).padStart(2, '0')
      resultGrid.innerHTML = renderResultMarkup(result)
      announcement.textContent = result.announcement
    },
    onShuffle(handler) {
      buttons.forEach((button) => button.addEventListener('click', handler))
    },
  }
}
