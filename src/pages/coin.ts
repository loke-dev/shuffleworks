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
  let flipping = false
  let settleTimer = 0
  const render = (results = Array.from({length:Number(count.value)}, () => 'H')) => {
    field.innerHTML = results.map((result, index) => {
      const graphic=result==='H'
        ? '<svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="18"/><path d="M21 84c3-22 14-34 29-34s26 12 29 34z"/></svg>'
        : '<svg viewBox="0 0 100 100"><path d="M50 9 60 38 91 50 60 61 50 91 39 61 9 50 39 38z"/><circle cx="50" cy="50" r="12"/></svg>'
      const emblem=`<b class="coin-emblem ${result==='H'?'coin-portrait':'coin-compass'}" aria-hidden="true">${graphic}</b>`
      return `<button type="button" class="coin-object" data-result="${result}" style="--delay:${index * 45}ms" aria-label="Flip ${results.length === 1 ? 'coin' : `coin ${index + 1}`}">
        <span class="coin-body">
          <span class="coin-face coin-front">${emblem}</span>
          <span class="coin-face coin-back">${emblem}</span>
          <span class="coin-edge" aria-hidden="true"></span>
        </span>
      </button>`
    }).join('')
  }
  count.addEventListener('input', () => { field.classList.remove('is-flipping'); label.textContent = `${count.value} ${count.value === '1' ? 'coin' : 'coins'}`; render() })
  const flip = () => {
    if (flipping) return
    flipping = true
    const results = Array.from({length:Number(count.value)}, () => randomInt(2) ? 'H' : 'T')
    field.classList.remove('is-flipping')
    render(results)
    void field.offsetWidth
    field.classList.add('is-flipping')
    button.disabled = true
    outcome.innerHTML='<span>In the air</span><b>Calling it…</b>'
    const settleDelay = 1850 + (results.length - 1) * 45
    let settled=false
    const settle=()=>{
      if(settled)return
      settled=true
      window.clearTimeout(settleTimer)
      const heads=results.filter(v=>v==='H').length
      const tails=results.length-heads
      outcome.innerHTML=results.length===1
        ? `<span>Landed</span><b>${results[0] === 'H' ? 'Heads' : 'Tails'}</b>`
        : `<span>${results.length} coins landed</span><b>${heads} heads · ${tails} tails</b>`
      page.announcement.textContent=outcome.textContent??''
      flipping=false
      button.disabled=false
    }
    field.querySelector('.coin-object:last-child')?.addEventListener('animationend',settle,{once:true})
    settleTimer=window.setTimeout(settle,settleDelay+120)
  }
  button.addEventListener('click',flip)
  field.addEventListener('click',(event)=>{if((event.target as Element).closest('.coin-object'))flip()})
  render()
}
