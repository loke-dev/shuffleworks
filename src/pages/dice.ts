import { createDiceShell } from '../shell/createDiceShell'
import { runMode } from './runMode'

export async function renderDice(root: HTMLElement) {
  document.title = 'Dice roller — Shuffleworks'
  const shell = createDiceShell(root)
  const [{ ShuffleEngine }, { DiceMode }] = await Promise.all([
    import('../engine/ShuffleEngine'),
    import('../modes/dice/DiceMode'),
  ])
  const mode = new DiceMode(shell.options())
  shell.onOptionsChange((options) => mode.setOptions(options))
  await runMode(shell, new ShuffleEngine(shell.canvas), mode, false)
}
