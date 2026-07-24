import { loadPlayers, parsePlayers, playersValue, savePlayers } from '../lib/partyPlayers'
import { randomInt, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const STORAGE_KEY = 'shuffleworks:hot-seat:players'
const prompts: Record<string, string[]> = {
  questions: [
    'What is your most irrational opinion?',
    'What would your warning label say?',
    'Which fictional world would you move into?',
    'What tiny thing makes you unreasonably happy?',
    'What is the funniest lie you believed as a child?',
    'Which skill would you download instantly?',
    'What would you do with one consequence-free day?',
    'What is your most useless talent?',
  ],
  likely: [
    'Who is most likely to survive a zombie outbreak?',
    'Who would accidentally become internet famous?',
    'Who would win a reality show?',
    'Who is most likely to miss their own flight?',
    'Who would make the best secret agent?',
    'Who would adopt a dangerous animal?',
    'Who is most likely to start a strange business?',
    'Who would befriend an alien first?',
  ],
  challenges: [
    'Sell the nearest object like a luxury product.',
    'Give a ten-second acceptance speech.',
    'Imitate another player until someone guesses.',
    'Invent a slogan for the group.',
    'Describe your day like a movie trailer.',
    'Make three animal sounds without laughing.',
    'Explain a simple task as badly as possible.',
    'Create a handshake with the person to your left.',
  ],
}

export function renderHotSeat(root: HTMLElement) {
  document.title = 'Hot Seat — Shuffleworks'
  let players = loadPlayers(STORAGE_KEY)
  let queue: string[] = []
  let history: string[] = []
  let picking = false

  const page = createToolPage(root, {
    id: 'hot-seat',
    index: '10',
    eyebrow: 'One player. One prompt.',
    title: 'Take the seat.<br><em>Face the room.</em>',
    accent: '#ff625b',
    intro: 'Choose somebody without repeats, then reveal a question, group vote, or quick challenge.',
    controls: `<label class="tool-field party-player-field"><span>Players · 2–16</span><textarea rows="4" data-players>${playersValue(players)}</textarea></label>
      <label class="tool-field"><span>Prompt pack</span><select data-pack><option value="questions">Hot questions</option><option value="likely">Most likely to</option><option value="challenges">Quick challenges</option></select></label>
      <button class="tool-action" type="button" data-pick><span>Pick the hot seat</span><kbd>Space</kbd></button>`,
    stage: `<div class="hot-seat-stage">
      <div class="hot-seat-chair" aria-hidden="true"><i></i><i></i><i></i></div>
      <article class="hot-seat-card" data-result>
        <span>Ready when the room is</span><h2>Who is up first?</h2><p>Nobody repeats until everyone has taken the seat.</p>
      </article>
    </div>
    <div class="tool-outcome hot-seat-history"><span>Previous seats</span><div data-history><p>None yet</p></div></div>`,
  })

  const playerInput = root.querySelector<HTMLTextAreaElement>('[data-players]')!
  const packSelect = root.querySelector<HTMLSelectElement>('[data-pack]')!
  const pickButton = root.querySelector<HTMLButtonElement>('[data-pick]')!
  const result = root.querySelector<HTMLElement>('[data-result]')!
  const stage = root.querySelector<HTMLElement>('.hot-seat-stage')!
  const historyElement = root.querySelector<HTMLElement>('[data-history]')!

  const syncPlayers = () => {
    const nextPlayers = parsePlayers(playerInput.value)
    if (nextPlayers.join('|') !== players.join('|')) queue = []
    players = nextPlayers
    savePlayers(STORAGE_KEY, players)
  }

  const renderHistory = () => {
    historyElement.innerHTML = history.length
      ? history.map((name, index) => `<i><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(name)}</i>`).join('')
      : '<p>None yet</p>'
  }

  const pick = () => {
    if (picking) return
    syncPlayers()
    if (players.length < 2) {
      result.innerHTML = '<span>Not enough players</span><h2>Add at least two names</h2><p>Then the room can choose its next victim.</p>'
      playerInput.focus()
      return
    }
    if (!queue.length) queue = shuffled(players)
    const selected = queue.pop()!
    const prompt = prompts[packSelect.value][randomInt(prompts[packSelect.value].length)]
    picking = true
    pickButton.disabled = true
    stage.classList.remove('is-picked')
    stage.classList.add('is-picking')

    let ticks = 0
    const ticker = window.setInterval(() => {
      const preview = players[randomInt(players.length)]
      result.innerHTML = `<span>Searching the room</span><h2>${escapeHtml(preview)}</h2><p>Hold that thought…</p>`
      ticks += 1
      if (ticks >= 8) window.clearInterval(ticker)
    }, 90)

    window.setTimeout(() => {
      window.clearInterval(ticker)
      stage.classList.remove('is-picking')
      stage.classList.add('is-picked')
      result.innerHTML = `<span>In the hot seat</span><h2>${escapeHtml(selected)}</h2><p>${escapeHtml(prompt)}</p>`
      history = [selected, ...history].slice(0, 5)
      renderHistory()
      page.announcement.textContent = `${selected} is in the hot seat. ${prompt}`
      picking = false
      pickButton.disabled = false
    }, 1050)
  }

  playerInput.addEventListener('change', syncPlayers)
  pickButton.addEventListener('click', pick)
  renderHistory()
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!) }
