import './style.css'
import { ShuffleEngine } from './engine/ShuffleEngine'
import { TeamMode } from './modes/teams/TeamMode'
import { createShell } from './shell/createShell'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) throw new Error('Shuffleworks root not found')

const shell = createShell(root)
const engine = new ShuffleEngine(shell.canvas)
const teams = new TeamMode(shell)

await engine.start(teams)
shell.setReady()

let isShuffling = false

async function shuffle() {
  if (isShuffling) return
  isShuffling = true
  shell.setShuffling(true)

  try {
    const result = await engine.shuffle()
    shell.renderResult(result)
  } finally {
    shell.setShuffling(false)
    isShuffling = false
  }
}

shell.onShuffle(shuffle)

window.addEventListener('keydown', (event) => {
  const refresh = event.code === 'F5'
    || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r')

  if (refresh || (event.code === 'Space' && event.target === document.body)) {
    event.preventDefault()
    shuffle()
  }
})

window.setTimeout(shuffle, 640)
