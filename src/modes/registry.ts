import type { AppShell } from '../shell/types'
import type { ModeDefinition } from './types'

export const modeRegistry: ModeDefinition[] = [
  {
    id: 'teams',
    name: 'Spectrum',
    order: 1,
    async load(shell: AppShell) {
      const { TeamMode } = await import('./teams/TeamMode')
      return new TeamMode(shell)
    },
  },
  {
    id: 'dice',
    name: 'Polyhedra',
    order: 2,
    async load() {
      const { DiceMode } = await import('./dice/DiceMode')
      return new DiceMode({ count: 2, sides: 6, faceStyle: 'classic' })
    },
  },
]

export async function loadMode(id: string, shell: AppShell) {
  const definition = modeRegistry.find((mode) => mode.id === id)
  if (!definition) throw new Error(`Unknown shuffle mode: ${id}`)
  return definition.load(shell)
}
