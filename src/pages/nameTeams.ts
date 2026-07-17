import { loadLocal, saveLocal, shuffled } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

const KEY='shuffleworks:team-names:v1'
const EXAMPLE_NAMES=['Alex','Sam','Robin','Charlie']
export function renderNameTeams(root: HTMLElement) {
  document.title='Team shuffler — Shuffleworks'
  const stored=loadLocal<string[]>(KEY,EXAMPLE_NAMES)
  const saved=Array.isArray(stored) && stored.filter(Boolean).length>=2 ? stored : EXAMPLE_NAMES
  const page=createToolPage(root,{id:'teams',index:'05',eyebrow:'People into groups',title:'Everyone gets<br><em>a side.</em>',accent:'#38a0ff',intro:'Enter the players, choose the number of teams, and shuffle.',controls:`<div class="name-editor" data-names></div><button class="text-action" data-add>+ Add player</button><label class="tool-field"><span>Number of teams</span><select data-team-count>${[2,3,4,5,6].map(n=>`<option>${n}</option>`).join('')}</select></label><button class="tool-action" data-shuffle-names><span>Shuffle teams</span><kbd>Space</kbd></button>`,stage:`<div class="generated-teams" data-generated><p>Add at least two players.</p></div>`})
  const editor=root.querySelector<HTMLElement>('[data-names]')!, generated=root.querySelector<HTMLElement>('[data-generated]')!, teamCount=root.querySelector<HTMLSelectElement>('[data-team-count]')!, button=root.querySelector<HTMLButtonElement>('[data-shuffle-names]')!
  let names=[...saved]
  const sync=()=>{ names=[...editor.querySelectorAll<HTMLInputElement>('input')].map(i=>i.value.trim()).filter(Boolean); saveLocal(KEY,names) }
  const renderEditor=()=>{ editor.innerHTML=names.map((name,index)=>`<label><span>${String(index+1).padStart(2,'0')}</span><input value="${escapeHtml(name)}" aria-label="Player ${index+1}"><button type="button" data-remove="${index}" aria-label="Remove ${escapeHtml(name)}">×</button></label>`).join(''); editor.querySelectorAll('input').forEach(i=>i.addEventListener('input',sync)); editor.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(b=>b.addEventListener('click',()=>{sync();names.splice(Number(b.dataset.remove),1);renderEditor();sync()})) }
  root.querySelector('[data-add]')!.addEventListener('click',()=>{sync();names.push('');renderEditor();editor.querySelector<HTMLInputElement>('label:last-child input')?.focus()})
  const shuffleTeams=(announce=true)=>{sync();if(names.length<2)return;const count=Math.min(Number(teamCount.value),names.length);const groups=Array.from({length:count},()=>[] as string[]);shuffled(names).forEach((name,index)=>groups[index%count].push(name));generated.innerHTML=groups.map((group,index)=>`<article style="--team:${['#a974ff','#38a0ff','#ff625b','#ffd84f','#67e8c3','#ff8ed4'][index]}"><span>Team ${index+1}</span><ol>${group.map(name=>`<li>${escapeHtml(name)}</li>`).join('')}</ol></article>`).join('');if(announce)page.announcement.textContent=`Created ${count} teams.`}
  button.addEventListener('click',()=>shuffleTeams())
  renderEditor()
  shuffleTeams(false)
}
function escapeHtml(value:string){const node=document.createElement('span');node.textContent=value;return node.innerHTML}
