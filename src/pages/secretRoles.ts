import { loadPlayers, parsePlayers, playersValue, savePlayers } from '../lib/partyPlayers'
import { randomInt, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const STORAGE_KEY = 'shuffleworks:secret-roles:players'
const topicPacks: Record<string, string[]> = {
  everyday: ['Coffee', 'Airport', 'Birthday cake', 'Supermarket', 'Umbrella', 'Elevator', 'Pizza', 'Toothbrush', 'Cinema', 'Backpack'],
  games: ['Final boss', 'Speedrun', 'Power-up', 'Respawn', 'Side quest', 'Controller', 'Checkpoint', 'Open world', 'High score', 'Loading screen'],
  places: ['Moon base', 'Water park', 'Museum', 'Train station', 'Haunted house', 'Football stadium', 'Desert island', 'Ski resort', 'Nightclub', 'Library'],
}

type PlayerRole = { name: string; impostor: boolean }

export function renderSecretRoles(root: HTMLElement) {
  document.title = 'Secret Roles — Shuffleworks'
  let players = loadPlayers(STORAGE_KEY)
  let roles: PlayerRole[] = []
  let topic = ''
  let playerIndex = 0
  let revealed = false

  const page = createToolPage(root, {
    id: 'secret-roles',
    index: '09',
    eyebrow: 'Trust absolutely nobody',
    title: 'One word.<br><em>Someone is lying.</em>',
    accent: '#a974ff',
    intro: 'Pass the phone around. Most players see the same secret word; the impostor sees only their role.',
    controls: `<label class="tool-field party-player-field"><span>Players · 3–16</span><textarea rows="4" data-players>${playersValue(players)}</textarea></label>
      <label class="tool-field"><span>Secret topic</span><select data-topic>${Object.keys(topicPacks).map((id) => `<option value="${id}">${capitalize(id)}</option>`).join('')}</select></label>
      <label class="tool-field"><span>Impostors</span><select data-impostors><option>1</option><option>2</option><option>3</option></select></label>
      <button class="tool-action" type="button" data-start><span>Deal secret roles</span><kbd>Space</kbd></button>`,
    stage: `<div class="secret-role-stage">
      <div class="secret-stack" aria-hidden="true"><i></i><i></i><i></i></div>
      <article class="secret-role-card" data-role-card>
        <span>Private cards ready</span><i>?</i><h2>Deal a secret round</h2><p>Each player reveals one card, then hides it before passing the phone.</p>
      </article>
      <button class="secret-card-action" type="button" data-card-action disabled>Tap to reveal</button>
    </div>
    <div class="tool-outcome"><span>Round status</span><b data-status>Waiting to deal</b></div>`,
  })

  const playerInput = root.querySelector<HTMLTextAreaElement>('[data-players]')!
  const topicSelect = root.querySelector<HTMLSelectElement>('[data-topic]')!
  const impostorSelect = root.querySelector<HTMLSelectElement>('[data-impostors]')!
  const startButton = root.querySelector<HTMLButtonElement>('[data-start]')!
  const startLabel = startButton.querySelector('span')!
  const card = root.querySelector<HTMLElement>('[data-role-card]')!
  const cardAction = root.querySelector<HTMLButtonElement>('[data-card-action]')!
  const status = root.querySelector<HTMLElement>('[data-status]')!
  const stage = root.querySelector<HTMLElement>('.secret-role-stage')!

  const syncPlayers = () => {
    players = parsePlayers(playerInput.value)
    savePlayers(STORAGE_KEY, players)
    impostorSelect.querySelectorAll('option').forEach((option) => {
      option.disabled = Number(option.value) >= players.length
    })
    if (Number(impostorSelect.value) >= players.length) impostorSelect.value = '1'
  }

  const showPassCard = () => {
    revealed = false
    stage.classList.remove('is-revealed')
    const current = roles[playerIndex]
    card.innerHTML = `<span>Player ${playerIndex + 1} of ${roles.length}</span><i>?</i><h2>${escapeHtml(current.name)}</h2><p>Make sure nobody else can see the screen.</p>`
    cardAction.textContent = 'Tap to reveal'
    status.textContent = `Pass to ${current.name}`
  }

  const finishRound = () => {
    stage.classList.remove('is-revealed')
    card.innerHTML = `<span>Roles delivered</span><i>✓</i><h2>Everyone knows.</h2><p>Give one clue each, then decide who is faking it.</p>`
    cardAction.disabled = true
    cardAction.textContent = 'Round in progress'
    status.textContent = 'Find the impostor'
    startLabel.textContent = 'Deal another round'
    page.announcement.textContent = 'All secret roles have been delivered. Start giving clues.'
  }

  const deal = () => {
    syncPlayers()
    if (players.length < 3) {
      status.textContent = 'Add at least 3 players'
      playerInput.focus()
      return
    }
    const impostorCount = Math.min(Number(impostorSelect.value), players.length - 1)
    const impostors = new Set(shuffled(players.map((_, index) => index)).slice(0, impostorCount))
    roles = players.map((name, index) => ({ name, impostor: impostors.has(index) }))
    topic = topicPacks[topicSelect.value][randomInt(topicPacks[topicSelect.value].length)]
    playerIndex = 0
    cardAction.disabled = false
    stage.classList.remove('is-complete')
    showPassCard()
    startLabel.textContent = 'Restart round'
    page.announcement.textContent = `Secret roles dealt to ${players.length} players. Pass the phone to ${roles[0].name}.`
  }

  cardAction.addEventListener('click', () => {
    if (!roles.length) return
    const current = roles[playerIndex]
    if (!revealed) {
      revealed = true
      stage.classList.add('is-revealed')
      card.innerHTML = current.impostor
        ? `<span>Keep this secret</span><i>◇</i><h2>You are the impostor</h2><p>Blend in. You do not know the secret word.</p>`
        : `<span>The secret word</span><i>“</i><h2>${topic}</h2><p>Give a useful clue without making the answer obvious.</p>`
      cardAction.textContent = 'Hide and pass'
      status.textContent = current.impostor ? 'Impostor revealed' : 'Word revealed'
      return
    }
    playerIndex += 1
    if (playerIndex >= roles.length) finishRound()
    else showPassCard()
  })

  playerInput.addEventListener('change', syncPlayers)
  startButton.addEventListener('click', deal)
  syncPlayers()
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1) }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!) }
