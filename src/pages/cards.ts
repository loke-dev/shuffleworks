import { loadLocal, saveLocal, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const STORAGE_KEY='shuffleworks:card-deck:v2'
const suits=[['♠','black'],['♥','red'],['♦','red'],['♣','black']] as const
const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K']
type DeckState={deck:string[];drawn:string[]}

export function renderCards(root:HTMLElement){
  document.title='Card draw — Shuffleworks'
  let {deck,drawn}=restoreDeck()
  let dealing=false
  const page=createToolPage(root,{id:'cards',index:'06',eyebrow:'A deck in motion',title:'Cut. Shuffle.<br><em>Draw.</em>',accent:'#ff625b',intro:'Shuffle a standard deck, then draw one or several cards without replacement.',controls:`<label class="tool-field"><span>Cards to draw</span><select data-draw-count>${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('')}</select></label><div class="tool-button-row"><button type="button" class="text-action" data-reset-deck>New deck</button><button type="button" class="tool-action" data-draw><span data-draw-label>Draw cards</span><kbd>Space</kbd></button></div>`,stage:`<div class="deck-stage"><button type="button" class="card-stack" data-deck aria-label="Draw from deck"></button><div class="drawn-cards" data-drawn aria-label="Last cards drawn"></div></div><div class="tool-outcome"><span>Remaining</span><b data-remaining>52 cards</b></div>`})
  const count=root.querySelector<HTMLSelectElement>('[data-draw-count]')!
  const deckEl=root.querySelector<HTMLButtonElement>('[data-deck]')!
  const drawnEl=root.querySelector<HTMLElement>('[data-drawn]')!
  const remaining=root.querySelector<HTMLElement>('[data-remaining]')!
  const draw=root.querySelector<HTMLButtonElement>('[data-draw]')!
  const drawLabel=root.querySelector<HTMLElement>('[data-draw-label]')!

  const render=()=>{
    const layers=Math.min(5,Math.ceil(deck.length/11))
    deckEl.dataset.empty=String(deck.length===0)
    deckEl.style.setProperty('--deck-progress',String(deck.length/52))
    deckEl.innerHTML=deck.length
      ? `${Array.from({length:layers},(_,index)=>`<i class="card-back" style="--layer:${index}"></i>`).join('')}<span class="deck-count"><b>${deck.length}</b><small>Click to draw</small></span>`
      : `<span class="deck-empty"><i>+</i><b>Open new deck</b></span>`
    deckEl.setAttribute('aria-label',deck.length?`Draw ${Math.min(Number(count.value),deck.length)} from ${deck.length} remaining cards`:'Open a new shuffled deck')
    drawnEl.innerHTML=drawn.length?drawn.map(cardMarkup).join(''):`<p class="draw-placeholder"><span>Last draw</span><b>Click the deck</b></p>`
    remaining.textContent=deck.length===0?'Deck empty':`${deck.length} ${deck.length===1?'card':'cards'}`
    drawLabel.textContent=deck.length===0?'Open new deck':'Draw cards'
    saveLocal(STORAGE_KEY,{deck,drawn})
  }

  const reset=(animate=true)=>{
    deck=shuffled(createDeck())
    drawn=[]
    render()
    if(animate){deckEl.classList.remove('is-opening');void deckEl.offsetWidth;deckEl.classList.add('is-opening')}
    page.announcement.textContent='Opened a new shuffled deck.'
  }

  const drawCards=()=>{
    if(dealing)return
    if(deck.length===0){reset();return}
    dealing=true
    draw.disabled=true
    const amount=Math.min(Number(count.value),deck.length)
    drawn=deck.splice(0,amount)
    render()
    drawnEl.classList.remove('is-dealing');deckEl.classList.remove('is-drawing')
    void drawnEl.offsetWidth
    drawnEl.classList.add('is-dealing');deckEl.classList.add('is-drawing')
    page.announcement.textContent=`Drew ${drawn.map(card=>card.split('|').slice(0,2).join(' ')).join(', ')}. ${deck.length} cards remain.`
    window.setTimeout(()=>{dealing=false;draw.disabled=false;drawnEl.classList.remove('is-dealing');deckEl.classList.remove('is-drawing')},900)
  }

  root.querySelector<HTMLButtonElement>('[data-reset-deck]')!.addEventListener('click',()=>reset())
  draw.addEventListener('click',drawCards)
  deckEl.addEventListener('click',drawCards)
  count.addEventListener('change',render)
  render()
}

function cardMarkup(card:string,index:number){
  const [rank,suit,color]=card.split('|')
  return `<i class="playing-card ${color}" style="--i:${index}"><span class="card-corner"><b>${rank}</b><em>${suit}</em></span><span class="card-suit">${suit}</span><span class="card-corner card-corner-bottom"><b>${rank}</b><em>${suit}</em></span></i>`
}

function restoreDeck():DeckState{
  const fallback={deck:shuffled(createDeck()),drawn:[] as string[]}
  const stored=loadLocal<DeckState>(STORAGE_KEY,fallback)
  const valid=new Set(createDeck())
  if(!stored||!Array.isArray(stored.deck)||!Array.isArray(stored.drawn))return fallback
  const combined=[...stored.deck,...stored.drawn]
  if(stored.deck.length>52||stored.drawn.length>5||combined.some(card=>!valid.has(card))||new Set(combined).size!==combined.length)return fallback
  return {deck:[...stored.deck],drawn:[...stored.drawn]}
}

function createDeck(){return suits.flatMap(([suit,color])=>ranks.map(rank=>`${rank}|${suit}|${color}`))}
