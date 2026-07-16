import type { ShuffleEngine } from '../engine/ShuffleEngine'
import type { ShuffleMode } from '../engine/types'
import type { AppShell } from '../shell/types'

export async function runMode(shell: AppShell, engine: ShuffleEngine, mode: ShuffleMode, autoShuffle = true) {
  await engine.start(mode)
  shell.setReady()
  let shuffling = false

  const shuffle = async () => {
    if (shuffling) return
    shuffling = true
    shell.setShuffling(true)
    try {
      shell.renderResult(await engine.shuffle())
    } finally {
      shell.setShuffling(false)
      shuffling = false
    }
  }

  shell.onShuffle(shuffle)
  window.addEventListener('keydown', (event) => {
    const refresh = event.code === 'F5' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r')
    if (refresh || (event.code === 'Space' && event.target === document.body)) {
      event.preventDefault()
      void shuffle()
    }
  })
  if (autoShuffle) window.setTimeout(shuffle, 640)
  return shuffle
}
