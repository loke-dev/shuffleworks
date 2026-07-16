const STORAGE_KEY = 'shuffleworks:dice-history:v1'
export const DICE_HISTORY_LIMIT = 25

export type DiceHistoryEntry = {
  id: string
  sides: number
  values: number[]
  total: number
  createdAt: number
}

export function loadDiceHistory(): DiceHistoryEntry[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter(isDiceHistoryEntry).slice(0, DICE_HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function saveDiceHistory(history: DiceHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, DICE_HISTORY_LIMIT)))
  } catch {
    // History remains available for this session when storage is unavailable.
  }
}

export function clearSavedDiceHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory history can still be cleared.
  }
}

function isDiceHistoryEntry(value: unknown): value is DiceHistoryEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<DiceHistoryEntry>
  return typeof entry.id === 'string'
    && Number.isInteger(entry.sides)
    && Array.isArray(entry.values)
    && entry.values.length > 0
    && entry.values.length <= 6
    && entry.values.every((face) => Number.isInteger(face) && face > 0 && face <= Number(entry.sides))
    && entry.total === entry.values.reduce((sum, face) => sum + face, 0)
    && typeof entry.createdAt === 'number'
}
