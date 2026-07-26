import { loadLocal, saveLocal } from './random'

export const DEFAULT_PARTY_PLAYERS = ['Alex', 'Sam', 'Robin', 'Kim']

export function loadPlayers(key: string) {
  const stored = cleanPlayers(loadLocal<unknown>(key, DEFAULT_PARTY_PLAYERS))
  return stored.length >= 2 ? stored : [...DEFAULT_PARTY_PLAYERS]
}

export function parsePlayers(value: string) {
  return cleanPlayers(value.split(/[\n,]+/))
}

export function savePlayers(key: string, players: string[]) {
  saveLocal(key, players)
}

export function playersValue(players: string[]) {
  return escapeHtml(players.join('\n'))
}

function cleanPlayers(players: unknown) {
  if (!Array.isArray(players)) return []
  return [...new Set(
    players
      .filter((name): name is string => typeof name === 'string')
      .map((name) => name.trim())
      .filter(Boolean),
  )].slice(0, 16)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character]!)
}
