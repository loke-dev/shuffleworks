import { loadLocal, saveLocal, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const KEY = 'shuffleworks:team-names:v1'
const TEAM_NAME_KEY = 'shuffleworks:team-labels:v1'
const SHARE_PARAM = 'lineup'
const EXAMPLE_NAMES = ['Alex', 'Sam', 'Robin', 'Charlie']
const COLORS = ['#a974ff', '#38a0ff', '#ff625b', '#ffd84f', '#67e8c3', '#ff8ed4', '#ff9f43', '#54a0ff', '#5fdd9d', '#c8a2ff']
const CALLSIGNS = ['Comets', 'Vectors', 'Sparks', 'Orbit', 'Pulse', 'Nova', 'Blaze', 'Tides', 'Volt', 'Quasar']

type SharedLineup = { groups: string[][]; labels: string[] }

export function renderNameTeams(root: HTMLElement) {
  document.title = 'Team shuffler — Shuffleworks'
  const stored = loadLocal<string[]>(KEY, EXAMPLE_NAMES)
  const saved = Array.isArray(stored) && stored.filter(Boolean).length >= 2 ? stored : EXAMPLE_NAMES
  const page = createToolPage(root, {
    id: 'teams',
    index: '05',
    eyebrow: 'People into groups',
    title: 'Everyone gets<br><em>a side.</em>',
    accent: '#38a0ff',
    intro: 'Enter the players, choose the number of teams, and launch a fresh lineup.',
    controls: `<div class="name-editor" data-names></div><button class="text-action" data-add>+ Add player</button><label class="tool-field"><span>Number of teams</span><select data-team-count>${Array.from({ length: 9 }, (_, index) => index + 2).map((number) => `<option>${number}</option>`).join('')}</select></label><button class="tool-action" data-shuffle-names><span>Launch teams</span><kbd>Space</kbd></button>`,
    stage: '<div class="team-board"><header><span>Live lineup</span><b data-team-summary>Ready to launch</b><button type="button" data-share-teams>Share lineup</button><i aria-hidden="true"></i></header><div class="generated-teams" data-generated></div></div>',
  })
  root.querySelector('.tool-shell')?.classList.add('teams-tool')

  const editor = root.querySelector<HTMLElement>('[data-names]')!
  const generated = root.querySelector<HTMLElement>('[data-generated]')!
  const teamCount = root.querySelector<HTMLSelectElement>('[data-team-count]')!
  const button = root.querySelector<HTMLButtonElement>('[data-shuffle-names]')!
  const shareButton = root.querySelector<HTMLButtonElement>('[data-share-teams]')!
  const summary = root.querySelector<HTMLElement>('[data-team-summary]')!
  const shared = readSharedLineup()
  let names = shared ? shared.groups.flat() : [...saved]
  let teamLabels = shared?.labels ?? loadLocal<string[]>(TEAM_NAME_KEY, CALLSIGNS)
  let currentGroups: string[][] = []
  let mixing = false

  const sync = () => {
    names = [...editor.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value.trim()).filter(Boolean)
    saveLocal(KEY, names)
  }

  const renderEditor = () => {
    editor.innerHTML = names.map((name, index) => `<label><span>${String(index + 1).padStart(2, '0')}</span><input value="${escapeHtml(name)}" aria-label="Player ${index + 1}"><button type="button" data-remove="${index}" aria-label="Remove ${escapeHtml(name)}">×</button></label>`).join('')
    editor.querySelectorAll('input').forEach((input) => input.addEventListener('input', sync))
    editor.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((remove) => remove.addEventListener('click', () => {
      sync()
      names.splice(Number(remove.dataset.remove), 1)
      renderEditor()
      sync()
    }))
  }

  root.querySelector('[data-add]')!.addEventListener('click', () => {
    sync()
    names.push('')
    renderEditor()
    editor.querySelector<HTMLInputElement>('label:last-child input')?.focus()
  })

  const renderGroups = (groups: string[][]) => {
    currentGroups = groups.map((group) => [...group])
    generated.innerHTML = groups.map((group, index) => `<article style="--team:${COLORS[index]};--delay:${index * 70}ms">
      <header><i>${String(index + 1).padStart(2, '0')}</i><div><span>Team ${index + 1}</span><input data-team-name="${index}" value="${escapeHtml(teamLabels[index] || CALLSIGNS[index])}" aria-label="Name for team ${index + 1}"></div><em>${group.length} ${group.length === 1 ? 'player' : 'players'}</em></header>
      <ol>${group.map((name) => `<li><i>${initials(name)}</i><b>${escapeHtml(name)}</b><span aria-hidden="true">↗</span></li>`).join('')}</ol>
    </article>`).join('')
    generated.querySelectorAll<HTMLInputElement>('[data-team-name]').forEach((input) => input.addEventListener('input', () => {
      const index = Number(input.dataset.teamName)
      teamLabels[index] = input.value
      saveLocal(TEAM_NAME_KEY, teamLabels)
    }))
    summary.textContent = `${names.length} players · ${groups.length} teams · balanced`
  }

  const shuffleTeams = (announce = true, animate = true) => {
    sync()
    if (mixing || names.length < 2) return
    const count = Math.min(Number(teamCount.value), names.length)
    const groups = Array.from({ length: count }, () => [] as string[])
    shuffled(names).forEach((name, index) => groups[index % count].push(name))

    const reveal = () => {
      renderGroups(groups)
      generated.classList.remove('is-mixing')
      generated.classList.add('is-revealing')
      window.setTimeout(() => generated.classList.remove('is-revealing'), 1200)
      mixing = false
      button.disabled = false
      if (announce) page.announcement.textContent = `Created ${count} teams for ${names.length} players.`
    }

    if (!animate) { reveal(); return }
    mixing = true
    button.disabled = true
    generated.classList.add('is-mixing')
    summary.textContent = 'Redistributing players…'
    window.setTimeout(reveal, 280)
  }

  button.addEventListener('click', () => shuffleTeams())
  teamCount.addEventListener('change', () => shuffleTeams())
  shareButton.addEventListener('click', async () => {
    if (!currentGroups.length) return
    generated.querySelectorAll<HTMLInputElement>('[data-team-name]').forEach((input) => {
      teamLabels[Number(input.dataset.teamName)] = input.value.trim() || CALLSIGNS[Number(input.dataset.teamName)]
    })
    saveLocal(TEAM_NAME_KEY, teamLabels)
    const url = new URL(window.location.href)
    url.searchParams.set(SHARE_PARAM, encodeSharedLineup({
      groups: currentGroups,
      labels: teamLabels.slice(0, currentGroups.length),
    }))
    window.history.replaceState({}, '', url)
    const shareData = { title: 'Shuffleworks team lineup', url: url.toString() }
    const canShare = typeof navigator.share === 'function'
    try {
      if (canShare) await navigator.share(shareData)
      else await navigator.clipboard.writeText(url.toString())
      shareButton.textContent = canShare ? 'Shared' : 'Link copied'
      page.announcement.textContent = canShare ? 'Team lineup shared.' : 'Team lineup link copied.'
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') page.announcement.textContent = 'Could not share the lineup.'
    }
    window.setTimeout(() => { shareButton.textContent = 'Share lineup' }, 1800)
  })
  renderEditor()
  if (shared) {
    teamCount.value = String(shared.groups.length)
    renderGroups(shared.groups)
    summary.textContent = `${names.length} players · ${shared.groups.length} teams · shared lineup`
  } else shuffleTeams(false, false)
}

function readSharedLineup(): SharedLineup | null {
  const encoded = new URL(window.location.href).searchParams.get(SHARE_PARAM)
  if (!encoded) return null
  try {
    const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0)))) as SharedLineup
    if (!Array.isArray(parsed.groups) || parsed.groups.length < 2 || parsed.groups.length > 10) return null
    if (!parsed.groups.every((group) => Array.isArray(group) && group.every((name) => typeof name === 'string'))) return null
    const labels = Array.isArray(parsed.labels) ? parsed.labels.filter((label) => typeof label === 'string').slice(0, parsed.groups.length) : []
    return { groups: parsed.groups, labels }
  } catch { return null }
}

function encodeSharedLineup(lineup: SharedLineup) {
  const bytes = new TextEncoder().encode(JSON.stringify(lineup))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function escapeHtml(value: string) {
  const node = document.createElement('span')
  node.textContent = value
  return node.innerHTML
}
