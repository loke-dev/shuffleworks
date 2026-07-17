import type { ShuffleResult } from '../engine/types'
import type { DiceOptions, DieSides, FaceStyle } from '../modes/dice/types'
import { clearSavedDiceHistory, DICE_HISTORY_LIMIT, loadDiceHistory, saveDiceHistory, type DiceHistoryEntry } from './diceHistory'
import { footerMarkup, navigationMarkup, brandMarkup } from './shared'
import type { AppShell } from './types'

export type DiceShell = AppShell & {
  onOptionsChange: (handler: (options: DiceOptions) => void) => void
  options: () => DiceOptions
}

export function createDiceShell(root: HTMLElement): DiceShell {
  root.innerHTML = `<div class="app-shell dice-shell">
    <main>
      <section class="dice-experience" aria-label="Interactive dice roller">
        <header class="topbar">${brandMarkup()}${navigationMarkup('dice')}<div class="mode-index"><span>Polyhedra</span><b>02</b></div></header>
        <div class="dice-world"><div class="dice-aura" aria-hidden="true"></div><canvas aria-label="Interactive 3D dice roll"></canvas><p class="dice-total"><span>Total</span><b data-dice-total>—</b></p><p class="render-label">Realtime polyhedra / WebGL</p></div>
        <div class="dice-controls" aria-label="Dice configuration">
          <fieldset><legend>How many</legend><div class="option-row" data-count-options>${[1,2,3,4,5,6].map((n) => `<button type="button" data-count="${n}" ${n === 2 ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${n}</button>`).join('')}</div></fieldset>
          <fieldset><legend>Die type</legend><div class="option-row die-types">${[4,6,8,10,12,20].map((n) => `<button type="button" data-sides="${n}" ${n === 6 ? 'aria-pressed="true"' : 'aria-pressed="false"'}>D${n}</button>`).join('')}</div></fieldset>
          <fieldset><legend>Face style</legend><div class="option-row face-styles"><button type="button" data-face-style="classic">Classic</button><button type="button" data-face-style="numbers">Numbers</button></div></fieldset>
          <button class="shuffle dice-roll" type="button" data-shuffle><i aria-hidden="true">↝</i><span>Roll dice</span><kbd>Space</kbd></button>
        </div>
      </section>

      <section class="mode-intro" aria-labelledby="dice-title">
        <p class="eyebrow">A configurable physics roll</p>
        <h1 id="dice-title">Give chance<br><em>some weight.</em></h1>
      </section>

      <section class="dice-result" aria-labelledby="dice-result-title">
        <div><p class="eyebrow">Latest outcome</p><h2 id="dice-result-title">Ready when<br>you are.</h2></div>
        <div class="dice-history-panel" aria-live="polite">
          <header><div><span>Roll history</span><b>Last ${DICE_HISTORY_LIMIT}</b></div><button type="button" data-clear-history>Clear history</button></header>
          <ol class="dice-history" data-dice-history></ol>
        </div>
      </section>

      <section class="dice-guide" aria-labelledby="dice-guide-title">
        <header><p class="eyebrow">A small polyhedral field guide</p><h2 id="dice-guide-title">Different shapes.<br>Different odds.</h2></header>
        <div class="die-guide-grid">${[[4,'Decisive','Fast binary-feeling outcomes.'],[6,'Classic','The universal game-night default.'],[8,'Balanced','A little more range, still quick to read.'],[10,'Decimal','Percentages and clean tens.'],[12,'Generous','More nuance without going maximal.'],[20,'Dramatic','Big range, critical highs, painful lows.']].map(([n,title,copy]) => `<article><span>D${n}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div>
      </section>
    </main>
    ${footerMarkup(new Date().getFullYear())}
    <p class="sr-only" aria-live="assertive" data-announcement></p>
  </div>`

  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!
  const rollButton = root.querySelector<HTMLButtonElement>('[data-shuffle]')!
  const rollLabel = rollButton.querySelector<HTMLElement>('span')!
  const historyList = root.querySelector<HTMLOListElement>('[data-dice-history]')!
  const clearHistoryButton = root.querySelector<HTMLButtonElement>('[data-clear-history]')!
  const resultTitle = root.querySelector<HTMLElement>('#dice-result-title')!
  const announcement = root.querySelector<HTMLElement>('[data-announcement]')!
  const totalDisplay = root.querySelector<HTMLElement>('[data-dice-total]')!
  let current: DiceOptions = { count: 2, sides: 6, faceStyle: loadFaceStyle() }
  let history = loadDiceHistory()
  const optionHandlers: Array<(options: DiceOptions) => void> = []

  const renderHistory = () => {
    clearHistoryButton.disabled = history.length === 0
    if (history.length === 0) {
      historyList.innerHTML = '<li class="dice-history-empty"><b>No rolls yet.</b><span>Your latest 25 rolls will stay on this device.</span></li>'
      resultTitle.innerHTML = 'Ready when<br>you are.'
      totalDisplay.textContent = '—'
      return
    }
    const latest = history[0]
    resultTitle.innerHTML = `Total<br>${latest.total}.`
    totalDisplay.textContent = String(latest.total)
    historyList.innerHTML = history.map((entry, index) => historyEntryMarkup(entry, index)).join('')
  }

  const updateOptions = (next: DiceOptions) => {
    current = next
    root.querySelectorAll<HTMLButtonElement>('[data-count]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.count) === current.count)))
    root.querySelectorAll<HTMLButtonElement>('[data-sides]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.sides) === current.sides)))
    root.querySelectorAll<HTMLButtonElement>('[data-face-style]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.faceStyle === current.faceStyle)))
    optionHandlers.forEach((handler) => handler(current))
  }

  root.querySelectorAll<HTMLButtonElement>('[data-count]').forEach((button) => button.addEventListener('click', () => updateOptions({ ...current, count: Number(button.dataset.count) })))
  root.querySelectorAll<HTMLButtonElement>('[data-sides]').forEach((button) => button.addEventListener('click', () => updateOptions({ ...current, sides: Number(button.dataset.sides) as DieSides })))
  root.querySelectorAll<HTMLButtonElement>('[data-face-style]').forEach((button) => button.addEventListener('click', () => {
    const faceStyle = button.dataset.faceStyle as FaceStyle
    saveFaceStyle(faceStyle)
    updateOptions({ ...current, faceStyle })
  }))
  updateOptions(current)
  clearHistoryButton.addEventListener('click', () => {
    history = []
    clearSavedDiceHistory()
    renderHistory()
    announcement.textContent = 'Dice roll history cleared.'
  })
  renderHistory()

  return {
    canvas,
    options: () => current,
    onOptionsChange(handler) { optionHandlers.push(handler) },
    setReady() { root.classList.add('is-ready') },
    setShuffling(active) {
      root.classList.toggle('is-shuffling', active)
      rollButton.disabled = active
      rollLabel.textContent = active ? 'Dice in motion…' : 'Roll dice'
      if (active) totalDisplay.textContent = '…'
      root.querySelectorAll<HTMLButtonElement>('.option-row button').forEach((button) => { button.disabled = active })
    },
    renderResult(result: ShuffleResult) {
      const group = result.groups[0]
      const values = group.items.map((item) => Number(item.label))
      const total = values.reduce((sum, value) => sum + value, 0)
      history = [{ id: crypto.randomUUID(), sides: current.sides, values, total, createdAt: Date.now() }, ...history].slice(0, DICE_HISTORY_LIMIT)
      saveDiceHistory(history)
      totalDisplay.textContent = String(total)
      resultTitle.innerHTML = `Total<br>${total}.`
      renderHistory()
      announcement.textContent = result.announcement
    },
    onShuffle(handler) { rollButton.addEventListener('click', handler) },
  }
}

const FACE_STYLE_KEY = 'shuffleworks:dice-face-style:v1'

function loadFaceStyle(): FaceStyle {
  try {
    return localStorage.getItem(FACE_STYLE_KEY) === 'numbers' ? 'numbers' : 'classic'
  } catch {
    return 'classic'
  }
}

function saveFaceStyle(faceStyle: FaceStyle) {
  try { localStorage.setItem(FACE_STYLE_KEY, faceStyle) } catch { /* Preference remains active for this session. */ }
}

function historyEntryMarkup(entry: DiceHistoryEntry, index: number) {
  const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(entry.createdAt)
  return `<li class="dice-history-entry${index === 0 ? ' is-latest' : ''}">
    <div class="dice-history-meta"><b>${index === 0 ? 'Latest' : `#${String(index + 1).padStart(2, '0')}`}</b><span>D${entry.sides} · ${entry.values.length} ${entry.values.length === 1 ? 'die' : 'dice'}</span><time datetime="${new Date(entry.createdAt).toISOString()}">${time}</time></div>
    <div class="dice-history-faces" aria-label="Faces: ${entry.values.join(', ')}">${entry.values.map((value) => `<i>${value}</i>`).join('')}</div>
    <div class="dice-history-total"><span>Total</span><b>${entry.total}</b></div>
  </li>`
}
