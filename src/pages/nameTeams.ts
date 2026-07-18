import { loadLocal, saveLocal, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const KEY = 'shuffleworks:team-names:v1'
const EXAMPLE_NAMES = ['Alex', 'Sam', 'Robin', 'Charlie']
const COLORS = ['#a974ff', '#38a0ff', '#ff625b', '#ffd84f', '#67e8c3', '#ff8ed4']
const CALLSIGNS = ['Comets', 'Vectors', 'Sparks', 'Orbit', 'Pulse', 'Nova']

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
    controls: `<div class="name-editor" data-names></div><button class="text-action" data-add>+ Add player</button><label class="tool-field"><span>Number of teams</span><select data-team-count>${[2, 3, 4, 5, 6].map((number) => `<option>${number}</option>`).join('')}</select></label><button class="tool-action" data-shuffle-names><span>Launch teams</span><kbd>Space</kbd></button>`,
    stage: '<div class="team-board"><header><span>Live lineup</span><b data-team-summary>Ready to launch</b><i aria-hidden="true"></i></header><div class="generated-teams" data-generated></div></div>',
  })
  root.querySelector('.tool-shell')?.classList.add('teams-tool')

  const editor = root.querySelector<HTMLElement>('[data-names]')!
  const generated = root.querySelector<HTMLElement>('[data-generated]')!
  const teamCount = root.querySelector<HTMLSelectElement>('[data-team-count]')!
  const button = root.querySelector<HTMLButtonElement>('[data-shuffle-names]')!
  const summary = root.querySelector<HTMLElement>('[data-team-summary]')!
  let names = [...saved]
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
    generated.innerHTML = groups.map((group, index) => `<article style="--team:${COLORS[index]};--delay:${index * 70}ms">
      <header><i>${String(index + 1).padStart(2, '0')}</i><div><span>Team ${index + 1}</span><b>${CALLSIGNS[index]}</b></div><em>${group.length} ${group.length === 1 ? 'player' : 'players'}</em></header>
      <ol>${group.map((name) => `<li><i>${initials(name)}</i><b>${escapeHtml(name)}</b><span aria-hidden="true">↗</span></li>`).join('')}</ol>
    </article>`).join('')
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
  renderEditor()
  shuffleTeams(false, false)
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function escapeHtml(value: string) {
  const node = document.createElement('span')
  node.textContent = value
  return node.innerHTML
}
