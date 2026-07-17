import { randomInt } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

export function renderCoin(root: HTMLElement) {
  document.title = 'Coin flip — Shuffleworks'
  const page = createToolPage(root, {
    id:'coin', index:'04', eyebrow:'A decisive metal toss', title:'Let it<br><em>land.</em>', accent:'#ffd84f', intro:'Flip one coin or a whole handful. Heads and tails settle together.',
    controls:`<label class="tool-field"><span>How many coins</span><input type="range" min="1" max="12" value="1" data-count><b data-count-label>1 coin</b></label><button class="tool-action" data-flip><span>Flip coins</span><kbd>Space</kbd></button>`,
    stage:`<div class="coin-field" data-coins></div><div class="tool-outcome" data-outcome><span>Ready</span><b>Heads or tails?</b></div>`,
  })
  const count = root.querySelector<HTMLInputElement>('[data-count]')!
  const label = root.querySelector<HTMLElement>('[data-count-label]')!
  const field = root.querySelector<HTMLElement>('[data-coins]')!
  const outcome = root.querySelector<HTMLElement>('[data-outcome]')!
  const button = root.querySelector<HTMLButtonElement>('[data-flip]')!
  const render = (results = Array.from({length:Number(count.value)}, () => 'H')) => {
    field.innerHTML = results.map((result, index) => `<i class="coin-object" data-result="${result}" style="--delay:${index * 45}ms">
      <span class="coin-face coin-heads"><small>Shuffleworks</small><b>H</b><em>Heads</em></span>
      <span class="coin-face coin-tails"><small>Make the call</small><b>T</b><em>Tails</em></span>
      <span class="coin-edge" aria-hidden="true"></span>
    </i>`).join('')
  }
  count.addEventListener('input', () => { label.textContent = `${count.value} ${count.value === '1' ? 'coin' : 'coins'}`; render() })
  button.addEventListener('click', () => {
    const results = Array.from({length:Number(count.value)}, () => randomInt(2) ? 'H' : 'T')
    render(results); field.classList.remove('is-flipping'); void field.offsetWidth; field.classList.add('is-flipping'); button.disabled = true
    const settleDelay = 1650 + (results.length - 1) * 45
    window.setTimeout(() => {
      const heads=results.filter(v=>v==='H').length
      outcome.innerHTML=`<span>${results.length} flipped</span><b>${heads} heads · ${results.length-heads} tails</b>`
      page.announcement.textContent=outcome.textContent??''
      field.classList.remove('is-flipping')
      button.disabled=false
    }, settleDelay)
  })
  render()
}
