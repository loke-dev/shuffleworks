import { loadLocal, saveLocal } from './random'

export const DEFAULT_PARTY_PLAYERS = ['Alex', 'Sam', 'Robin', 'Kim']

export function loadPlayers(key: string) {
  const stored = loadLocal<string[]>(key, DEFAULT_PARTY_PLAYERS)
  return cleanPlayers(stored).length >= 2 ? cleanPlayers(stored) : [...DEFAULT_PARTY_PLAYERS]
}

export function parsePlayers(value: string) {
  return cleanPlayers(value.split(/[\n,]+/))
}

export function savePlayers(key: string, players: string[]) {
  saveLocal(key, players)
}

export function playersValue(players: string[]) {
  return players.join('\n')
}

function cleanPlayers(players: string[]) {
  return [...new Set(players.map((name) => name.trim()).filter(Boolean))].slice(0, 16)
}
