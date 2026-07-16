import type { ShuffleMode } from '../engine/types'
import type { AppShell } from '../shell/types'

export type ModeDefinition = {
  id: string
  name: string
  order: number
  load: (shell: AppShell) => Promise<ShuffleMode>
}
