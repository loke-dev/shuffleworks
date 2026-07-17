import { loadLocal, randomInt, saveLocal } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const KEY = 'shuffleworks:wheel-entries:v1'
const SPIN_DURATION = 4200
const LABEL_RADIUS = 34
const fallback = ['Pizza', 'Tacos', 'Burgers', 'Sushi', 'Pasta', 'Surprise me']

export function renderWheel(root: HTMLElement) {
  document.title = 'Spinner wheel — Shuffleworks'
  const entries = loadLocal<string[]>(KEY, fallback)
  const page = createToolPage(root, {
    id:'wheel', index:'03', eyebrow:'Custom decision spinner', title:'Spin the<br><em>possibilities.</em>', accent:'#a974ff',
    intro:'Add any choices, then give the wheel a physical spin.',
    controls:`<label class="tool-field"><span>Entries · one per line</span><textarea data-entries rows="8"></textarea></label><button class="tool-action" data-spin><span>Spin wheel</span><kbd>Space</kbd></button>`,
    stage:`<div class="wheel-wrap"><i class="wheel-pointer"></i><div class="choice-wheel" data-wheel></div><button class="wheel-hub" data-spin aria-label="Spin wheel">Spin</button></div><div class="tool-outcome" data-outcome><span>Ready</span><b>Add choices and spin.</b></div>`,
  })
  const textarea = root.querySelector<HTMLTextAreaElement>('[data-entries]')!
  const wheel = root.querySelector<HTMLElement>('[data-wheel]')!
  const outcome = root.querySelector<HTMLElement>('[data-outcome]')!
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-spin]')]
  let turns = 0
  let rotation = 0
  let settleTimer = 0
  textarea.value = entries.join('\n')
  const getEntries = () => textarea.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 24)
  const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360
  const render = () => {
    const values = getEntries()
    const colors = ['#6d54ad','#286c9d','#9f494b','#9d873c','#367d70','#955478']
    wheel.style.background = values.length ? `conic-gradient(${values.map((_, index) => `${colors[index % colors.length]} ${index / values.length * 100}% ${(index + 1) / values.length * 100}%`).join(',')})` : '#161822'
    wheel.innerHTML = values.map((value, index) => {
      const angle = (index + .5) / values.length * 360
      const radians = angle * Math.PI / 180
      const x = 50 + Math.sin(radians) * LABEL_RADIUS
      const y = 50 - Math.cos(radians) * LABEL_RADIUS
      const classes = value.length > 9 ? 'is-long' : ''
      return `<span data-angle="${angle}" data-index="${index}" class="${classes}" style="--angle:${angle}deg;--label-x:${x}%;--label-y:${y}%"><b>${escapeHtml(value)}</b></span>`
    }).join('')
    saveLocal(KEY, values)
  }
  const spin = () => {
    const values = getEntries(); if (values.length < 2) return
    buttons.forEach((button) => { button.disabled = true })
    const target = randomInt(values.length)
    turns += 5 + randomInt(3)
    const center = (target + .5) / values.length * 360
    rotation = turns * 360 - center
    wheel.classList.add('is-spinning')
    wheel.querySelector('.is-selected')?.classList.remove('is-selected')
    textarea.disabled = true
    wheel.style.transform = `rotate(${rotation}deg)`
    let settled = false
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === wheel && event.propertyName === 'transform') settle()
    }
    const settle = () => {
      if (settled) return
      settled = true
      window.clearTimeout(settleTimer)
      wheel.removeEventListener('transitionend', onTransitionEnd)
      const pointerAngle = normalizeAngle(-rotation)
      const winner = Math.floor(pointerAngle / (360 / values.length)) % values.length
      wheel.classList.remove('is-spinning')
      wheel.querySelector(`[data-index="${winner}"]`)?.classList.add('is-selected')
      outcome.innerHTML = `<span>Selected</span><b>${escapeHtml(values[winner])}</b>`
      page.announcement.textContent = `Selected ${values[winner]}`
      textarea.disabled = false
      buttons.forEach((button) => { button.disabled = false })
    }
    wheel.addEventListener('transitionend', onTransitionEnd)
    settleTimer = window.setTimeout(settle, SPIN_DURATION + 500)
  }
  textarea.addEventListener('input', render)
  buttons.forEach((button) => button.addEventListener('click', spin))
  render()
}

function escapeHtml(value:string){const node=document.createElement('span');node.textContent=value;return node.innerHTML}
