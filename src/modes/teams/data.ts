import type { ShuffleItem } from '../../engine/types'

export type TeamCardData = ShuffleItem & { symbol: string }

export const teamPalette: TeamCardData[] = [
  { id: 'yellow', label: 'Yellow', symbol: '△', color: '#ffd84f' },
  { id: 'purple', label: 'Purple', symbol: '□', color: '#a974ff' },
  { id: 'blue', label: 'Blue', symbol: '×', color: '#38a0ff' },
  { id: 'red', label: 'Red', symbol: '○', color: '#ff625b' },
]
