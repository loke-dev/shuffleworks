import { loadLocal, randomInt, saveLocal } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const KEY = 'shuffleworks:wheel-entries:v1'
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
  textarea.value = entries.join('\n')
  const getEntries = () => textarea.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 24)
  const isUpsideDown = (angle: number) => {
    const normalized = ((angle + rotation) % 360 + 360) % 360
    return normalized > 90 && normalized < 270
  }
  const orientLabels = () => {
    wheel.querySelectorAll<HTMLElement>('[data-angle]').forEach((label) => {
      const angle = Number(label.dataset.angle)
      label.classList.toggle('is-flipped', isUpsideDown(angle))
    })
  }
  const render = () => {
    const values = getEntries()
    const colors = ['#6d54ad','#286c9d','#9f494b','#9d873c','#367d70','#955478']
    wheel.style.background = values.length ? `conic-gradient(${values.map((_, index) => `${colors[index % colors.length]} ${index / values.length * 100}% ${(index + 1) / values.length * 100}%`).join(',')})` : '#161822'
    wheel.innerHTML = values.map((value, index) => {
      const angle = (index + .5) / values.length * 360
      return `<span data-angle="${angle}" class="${isUpsideDown(angle) ? 'is-flipped' : ''}" style="--angle:${angle}deg"><b>${escapeHtml(value)}</b></span>`
    }).join('')
    saveLocal(KEY, values)
  }
  const spin = () => {
    const values = getEntries(); if (values.length < 2) return
    buttons.forEach((button) => { button.disabled = true })
    const winner = randomInt(values.length)
    turns += 5 + randomInt(3)
    const center = (winner + .5) / values.length * 360
    rotation = turns * 360 - center
    wheel.classList.add('is-spinning')
    wheel.style.transform = `rotate(${rotation}deg)`
    window.setTimeout(() => {
      wheel.classList.remove('is-spinning')
      orientLabels()
      outcome.innerHTML = `<span>Selected</span><b>${escapeHtml(values[winner])}</b>`
      page.announcement.textContent = `Selected ${values[winner]}`
      buttons.forEach((button) => { button.disabled = false })
    }, 3400)
  }
  textarea.addEventListener('input', render)
  buttons.forEach((button) => button.addEventListener('click', spin))
  window.addEventListener('keydown', (event) => { if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); spin() } })
  render()
}

function escapeHtml(value:string){const node=document.createElement('span');node.textContent=value;return node.innerHTML}
