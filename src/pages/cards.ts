import { shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const suits=[['♠','black'],['♥','red'],['♦','red'],['♣','black']] as const
const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K']
export function renderCards(root:HTMLElement){
  document.title='Card draw — Shuffleworks';let deck=createDeck();let drawn:string[]=[]
  const page=createToolPage(root,{id:'cards',index:'06',eyebrow:'A deck in motion',title:'Cut. Shuffle.<br><em>Draw.</em>',accent:'#ff625b',intro:'Shuffle a standard deck, then draw one or several cards without replacement.',controls:`<label class="tool-field"><span>Cards to draw</span><select data-draw-count>${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('')}</select></label><div class="tool-button-row"><button class="text-action" data-reset-deck>New deck</button><button class="tool-action" data-draw>Draw cards</button></div>`,stage:`<div class="deck-stage"><div class="card-stack" data-deck><i></i><i></i><i></i></div><div class="drawn-cards" data-drawn></div></div><div class="tool-outcome"><span>Remaining</span><b data-remaining>52 cards</b></div>`})
  const count=root.querySelector<HTMLSelectElement>('[data-draw-count]')!,drawnEl=root.querySelector<HTMLElement>('[data-drawn]')!,remaining=root.querySelector<HTMLElement>('[data-remaining]')!,draw=root.querySelector<HTMLButtonElement>('[data-draw]')!
  const render=()=>{drawnEl.innerHTML=drawn.map(card=>{const [rank,suit,color]=card.split('|');return `<i class="playing-card ${color}"><b>${rank}</b><span>${suit}</span><b>${rank}</b></i>`}).join('');remaining.textContent=`${deck.length} cards`}
  const reset=()=>{deck=shuffled(createDeck());drawn=[];render()};root.querySelector('[data-reset-deck]')!.addEventListener('click',reset);draw.addEventListener('click',()=>{if(deck.length===0)reset();drawn=deck.splice(0,Math.min(Number(count.value),deck.length));render();drawnEl.classList.remove('is-dealing');void drawnEl.offsetWidth;drawnEl.classList.add('is-dealing');page.announcement.textContent=`Drew ${drawn.map(c=>c.split('|').slice(0,2).join(' ')).join(', ')}`});reset()
}
function createDeck(){return suits.flatMap(([suit,color])=>ranks.map(rank=>`${rank}|${suit}|${color}`))}
