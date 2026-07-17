import { randomInt } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const choices = [
  ['rock', '✊'],
  ['paper', '✋'],
  ['scissors', '✌️'],
] as const

type Choice = (typeof choices)[number][0]

const iconFor = (choice: Choice) => choices.find(([id]) => id === choice)![1]
const choiceIndex = (choice: Choice) => choices.findIndex(([id]) => id === choice)

export function renderRps(root: HTMLElement) {
  document.title = 'Rock paper scissors — Shuffleworks'

  let selected: Choice = 'rock'
  let wins = 0
  let losses = 0
  let draws = 0
  let isThrowing = false

  const page = createToolPage(root, {
    id: 'rps',
    index: '07',
    eyebrow: 'The classic decider',
    title: 'Rock. Paper.<br><em>Scissors.</em>',
    accent: '#67e8c3',
    intro: 'Choose your move, then throw against the machine.',
    controls: `<fieldset class="rps-choices"><legend>Your move</legend>${choices.map(([id, icon]) => `<button data-choice="${id}" aria-pressed="${id === 'rock'}"><i>${icon}</i><span>${id}</span></button>`).join('')}</fieldset><button class="tool-action" data-throw><span>Throw</span><kbd>Space</kbd></button>`,
    stage: '<div class="rps-arena"><article><span>You</span><b data-player>✊</b></article><i>VS</i><article><span>Machine</span><b data-machine>?</b></article></div><div class="tool-outcome" data-rps-result><span>Score · 0–0–0</span><b>Choose your move.</b></div>',
  })

  const arena = root.querySelector<HTMLElement>('.rps-arena')!
  const player = root.querySelector<HTMLElement>('[data-player]')!
  const machine = root.querySelector<HTMLElement>('[data-machine]')!
  const result = root.querySelector<HTMLElement>('[data-rps-result]')!
  const throwButton = root.querySelector<HTMLButtonElement>('[data-throw]')!
  const choiceButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-choice]')]

  const score = () => `Score · ${wins}–${losses}–${draws}`
  const setControlsDisabled = (disabled: boolean) => {
    throwButton.disabled = disabled
    choiceButtons.forEach((button) => { button.disabled = disabled })
  }

  choiceButtons.forEach((button) => button.addEventListener('click', () => {
    if (isThrowing) return
    selected = button.dataset.choice as Choice
    choiceButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)))
    player.textContent = iconFor(selected)
  }))

  throwButton.addEventListener('click', () => {
    if (isThrowing) return

    isThrowing = true
    setControlsDisabled(true)

    const playerChoice = selected
    const opponent = choices[randomInt(choices.length)][0]
    let revealed = false
    let settled = false
    let fallbackTimer = 0

    player.textContent = '✊'
    machine.textContent = '✊'
    result.innerHTML = `<span>${score()}</span><b>Rock · paper · scissors…</b>`

    const reveal = () => {
      if (revealed) return
      revealed = true
      player.textContent = iconFor(playerChoice)
      machine.textContent = iconFor(opponent)
      result.innerHTML = `<span>${score()}</span><b>Shoot!</b>`
    }

    const settle = () => {
      if (settled) return
      settled = true
      window.clearTimeout(fallbackTimer)
      arena.classList.remove('is-throwing')
      reveal()

      const difference = (choiceIndex(playerChoice) - choiceIndex(opponent) + choices.length) % choices.length
      const verdict = difference === 0 ? 'Draw' : difference === 1 ? 'You win' : 'Machine wins'
      if (difference === 0) draws += 1
      else if (difference === 1) wins += 1
      else losses += 1

      result.innerHTML = `<span>${score()}</span><b>${verdict}</b>`
      page.announcement.textContent = `${playerChoice} versus ${opponent}. ${verdict}.`
      isThrowing = false
      setControlsDisabled(false)
    }

    player.addEventListener('animationend', settle, { once: true })

    arena.classList.remove('is-throwing')
    void arena.offsetWidth
    arena.classList.add('is-throwing')

    fallbackTimer = window.setTimeout(settle, 1600)
  })
}
