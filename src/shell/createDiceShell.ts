import type { ShuffleResult } from '../engine/types'
import type { DiceOptions, DieSides } from '../modes/dice/types'
import { footerMarkup, navigationMarkup, brandMarkup } from './shared'
import type { AppShell } from './types'

export type DiceShell = AppShell & {
  onOptionsChange: (handler: (options: DiceOptions) => void) => void
  options: () => DiceOptions
}

export function createDiceShell(root: HTMLElement): DiceShell {
  root.innerHTML = `<div class="app-shell dice-shell">
    <main>
      <section class="dice-experience" aria-labelledby="dice-title">
        <header class="topbar">${brandMarkup()}${navigationMarkup('dice')}<div class="mode-index"><span>Polyhedra</span><b>02</b></div></header>
        <div class="dice-copy"><p class="eyebrow">A configurable physics roll</p><h1 id="dice-title">Give chance<br><em>some weight.</em></h1></div>
        <div class="dice-world"><div class="dice-aura" aria-hidden="true"></div><canvas aria-label="Interactive 3D dice roll"></canvas><p class="dice-total"><span>Total</span><b data-dice-total>—</b></p><p class="render-label">Realtime polyhedra / WebGL</p></div>
        <div class="dice-controls" aria-label="Dice configuration">
          <fieldset><legend>How many</legend><div class="option-row" data-count-options>${[1,2,3,4,5,6].map((n) => `<button type="button" data-count="${n}" ${n === 2 ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${n}</button>`).join('')}</div></fieldset>
          <fieldset><legend>Die type</legend><div class="option-row die-types">${[4,6,8,10,12,20].map((n) => `<button type="button" data-sides="${n}" ${n === 6 ? 'aria-pressed="true"' : 'aria-pressed="false"'}>D${n}</button>`).join('')}</div></fieldset>
          <button class="shuffle dice-roll" type="button" data-shuffle><i aria-hidden="true">↝</i><span>Roll dice</span><kbd>Space</kbd></button>
        </div>
      </section>

      <section class="dice-result" aria-labelledby="dice-result-title">
        <div><p class="eyebrow">Latest outcome</p><h2 id="dice-result-title">Ready when<br>you are.</h2></div>
        <div class="dice-result-grid" aria-live="polite"><p>Choose a setup and roll the room.</p></div>
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
  const resultGrid = root.querySelector<HTMLElement>('.dice-result-grid')!
  const resultTitle = root.querySelector<HTMLElement>('#dice-result-title')!
  const announcement = root.querySelector<HTMLElement>('[data-announcement]')!
  const totalDisplay = root.querySelector<HTMLElement>('[data-dice-total]')!
  let current: DiceOptions = { count: 2, sides: 6 }
  const optionHandlers: Array<(options: DiceOptions) => void> = []

  const updateOptions = (next: DiceOptions) => {
    current = next
    root.querySelectorAll<HTMLButtonElement>('[data-count]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.count) === current.count)))
    root.querySelectorAll<HTMLButtonElement>('[data-sides]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.sides) === current.sides)))
    optionHandlers.forEach((handler) => handler(current))
  }

  root.querySelectorAll<HTMLButtonElement>('[data-count]').forEach((button) => button.addEventListener('click', () => updateOptions({ ...current, count: Number(button.dataset.count) })))
  root.querySelectorAll<HTMLButtonElement>('[data-sides]').forEach((button) => button.addEventListener('click', () => updateOptions({ ...current, sides: Number(button.dataset.sides) as DieSides })))

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
      const total = group.items.reduce((sum, item) => sum + Number(item.label), 0)
      totalDisplay.textContent = String(total)
      resultTitle.innerHTML = `Total<br>${total}.`
      resultGrid.innerHTML = `<header><span>${group.label}</span><b>${group.items.length} dice</b></header><ul>${group.items.map((item, index) => `<li><i style="--die-color:${item.color}"></i><span>Die ${index + 1}</span><b>${item.label}</b></li>`).join('')}</ul>`
      announcement.textContent = result.announcement
    },
    onShuffle(handler) { rollButton.addEventListener('click', handler) },
  }
}
