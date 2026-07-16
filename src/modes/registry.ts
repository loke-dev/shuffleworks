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
]

export async function loadMode(id: string, shell: AppShell) {
  const definition = modeRegistry.find((mode) => mode.id === id)
  if (!definition) throw new Error(`Unknown shuffle mode: ${id}`)
  return definition.load(shell)
}
