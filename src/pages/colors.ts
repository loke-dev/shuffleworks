import { loadMode } from '../modes/registry'
import { createShell } from '../shell/createShell'
import { runMode } from './runMode'

export async function renderColors(root: HTMLElement) {
  document.title = 'Color shuffle — Shuffleworks'
  const shell = createShell(root)
  const [{ ShuffleEngine }, mode] = await Promise.all([
    import('../engine/ShuffleEngine'),
    loadMode('teams', shell),
  ])
  await runMode(shell, new ShuffleEngine(shell.canvas), mode)
}
