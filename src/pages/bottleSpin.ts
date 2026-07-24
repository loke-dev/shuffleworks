import { loadPlayers, parsePlayers, playersValue, savePlayers } from '../lib/partyPlayers'
import { randomInt } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const STORAGE_KEY = 'shuffleworks:bottle-spin:players'

export function renderBottleSpin(root: HTMLElement) {
  document.title = 'Spin the Bottle — Shuffleworks'
  let players = loadPlayers(STORAGE_KEY)
  let rotation = 0
  let spinning = false
  let selectedIndex = -1
  let fallbackTimer = 0

  const page = createToolPage(root, {
    id: 'bottle-spin',
    index: '11',
    eyebrow: 'Put chance on the table',
    title: 'Gather around.<br><em>Give it a spin.</em>',
    accent: '#67e8c3',
    intro: 'Arrange the group around one glass bottle. Its final angle chooses the player—no interpretation required.',
    controls: `<label class="tool-field party-player-field"><span>Players · 2–12</span><textarea rows="4" data-players>${playersValue(players)}</textarea></label>
      <div class="bottle-rule"><span>Landing rule</span><b>The bottle points to the chosen player</b></div>
      <button class="tool-action" type="button" data-spin><span>Spin the bottle</span><kbd>Space</kbd></button>`,
    stage: `<div class="bottle-table">
      <div class="bottle-seats" data-seats></div>
      <div class="bottle-rings" aria-hidden="true"></div>
      <button class="spin-bottle" type="button" data-bottle aria-label="Spin the bottle">
        <i class="bottle-neck"></i><i class="bottle-body"><b>SHUFFLE<br>WORKS</b></i><i class="bottle-glint"></i>
      </button>
      <div class="bottle-center" aria-hidden="true"></div>
    </div>
    <div class="tool-outcome"><span>The bottle chooses</span><b data-result>Waiting for a spin</b></div>`,
  })

  const playerInput = root.querySelector<HTMLTextAreaElement>('[data-players]')!
  const seats = root.querySelector<HTMLElement>('[data-seats]')!
  const bottle = root.querySelector<HTMLButtonElement>('[data-bottle]')!
  const spinButton = root.querySelector<HTMLButtonElement>('[data-spin]')!
  const result = root.querySelector<HTMLElement>('[data-result]')!
  const table = root.querySelector<HTMLElement>('.bottle-table')!

  const renderSeats = () => {
    seats.innerHTML = players.map((name, index) => {
      const angle = index / players.length * Math.PI * 2
      const x = 50 + Math.sin(angle) * 43
      const y = 50 - Math.cos(angle) * 43
      return `<i class="${index === selectedIndex ? 'is-selected' : ''}" style="--seat-x:${x}%;--seat-y:${y}%"><span>${index + 1}</span><b>${escapeHtml(name)}</b></i>`
    }).join('')
  }

  const syncPlayers = () => {
    players = parsePlayers(playerInput.value).slice(0, 12)
    savePlayers(STORAGE_KEY, players)
    selectedIndex = -1
    renderSeats()
  }

  const settle = () => {
    if (!spinning) return
    spinning = false
    window.clearTimeout(fallbackTimer)
    table.classList.remove('is-spinning')
    selectedIndex = Math.round(((rotation % 360) / 360) * players.length) % players.length
    const chosen = players[selectedIndex]
    result.textContent = chosen
    renderSeats()
    spinButton.disabled = false
    page.announcement.textContent = `The bottle chose ${chosen}.`
  }

  const spin = () => {
    if (spinning) return
    syncPlayers()
    if (players.length < 2) {
      result.textContent = 'Add at least 2 players'
      playerInput.focus()
      return
    }
    selectedIndex = randomInt(players.length)
    const targetAngle = selectedIndex / players.length * 360
    const currentNormalized = ((rotation % 360) + 360) % 360
    const forwardDistance = (targetAngle - currentNormalized + 360) % 360
    rotation += (6 + randomInt(3)) * 360 + forwardDistance
    spinning = true
    spinButton.disabled = true
    result.textContent = 'Spinning…'
    renderSeats()
    table.classList.remove('is-spinning')
    void table.offsetWidth
    table.classList.add('is-spinning')
    bottle.style.setProperty('--bottle-rotation', `${rotation}deg`)
    fallbackTimer = window.setTimeout(settle, 5200)
  }

  bottle.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform') settle()
  })
  bottle.addEventListener('click', spin)
  spinButton.addEventListener('click', spin)
  playerInput.addEventListener('change', syncPlayers)
  renderSeats()
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!) }
