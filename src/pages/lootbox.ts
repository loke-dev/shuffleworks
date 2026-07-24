import { loadLocal, randomInt, saveLocal } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
type Drop = {
  name: string
  description: string
  rarity: Rarity
  icon: string
}

const STORAGE_KEY = 'shuffleworks:party-crate:v1'
const rarityWeight: Record<Rarity, number> = {
  Common: 45,
  Uncommon: 29,
  Rare: 16,
  Epic: 8,
  Legendary: 2,
}

const packs: Record<string, { label: string; drops: Drop[] }> = {
  party: {
    label: 'Party perks',
    drops: [
      drop('Seat swap', 'Choose any two people to swap seats.', 'Common', '↔'),
      drop('Snack claim', 'You choose the next snack for the table.', 'Common', '◇'),
      drop('DJ for a song', 'You control the next song. No vetoes.', 'Common', '♪'),
      drop('Question shield', 'Skip one question or prompt tonight.', 'Uncommon', '◌'),
      drop('Double vote', 'Your vote counts twice on the next group decision.', 'Uncommon', '×2'),
      drop('Challenge redirect', 'Pass your next challenge to another player.', 'Rare', '↗'),
      drop('Rule maker', 'Create one harmless rule for the next ten minutes.', 'Rare', '§'),
      drop('Chaos token', 'Trigger an immediate seat shuffle.', 'Epic', '✦'),
      drop('Main character', 'Choose the next game, song, and starting player.', 'Legendary', '★'),
    ],
  },
  dares: {
    label: 'Dare drops',
    drops: [
      drop('Tiny speech', 'Give a dramatic ten-second speech about the nearest object.', 'Common', '“'),
      drop('Sound effect', 'Narrate the next action with your best sound effects.', 'Common', '≋'),
      drop('Accent round', 'Speak in a chosen accent until your next turn.', 'Common', '≈'),
      drop('Compliment drop', 'Give a suspiciously specific compliment to another player.', 'Uncommon', '+'),
      drop('Victory dance', 'Perform the celebration you would use after a world final.', 'Uncommon', '↟'),
      drop('Impression', 'The group chooses someone for you to impersonate.', 'Rare', '◐'),
      drop('Reverse host', 'Run the next round as if this is your own game show.', 'Rare', '◫'),
      drop('Triple dare', 'Pick one of three dares invented by the room.', 'Epic', 'Ⅲ'),
      drop('The wildcard', 'Invent a dare. The room must accept it or everyone does it.', 'Legendary', '✶'),
    ],
  },
  match: {
    label: 'Match night',
    drops: [
      drop('Kick-off', 'You choose who starts with the ball.', 'Common', '○'),
      drop('Kit control', 'Choose the kits or colors for the next match.', 'Common', '◩'),
      drop('Music pick', 'Choose the walkout song.', 'Common', '♪'),
      drop('Side select', 'Choose which side or controller you use.', 'Uncommon', '↔'),
      drop('Instant rematch', 'Bank one no-questions-asked rematch.', 'Uncommon', '↻'),
      drop('Team reroll', 'Shuffle either team once before the match.', 'Rare', '↝'),
      drop('Home advantage', 'Choose the map, arena, or stadium.', 'Rare', '⌂'),
      drop('One-goal shield', 'Cancel one agreed match-night handicap.', 'Epic', '⬡'),
      drop('Commissioner', 'Set the format for the next three matches.', 'Legendary', '♛'),
    ],
  },
}

export function renderLootbox(root: HTMLElement) {
  document.title = 'Party Loot Box — Shuffleworks'
  let history = loadLocal<Drop[]>(STORAGE_KEY, []).slice(0, 5)
  let opening = false

  const page = createToolPage(root, {
    id: 'lootbox',
    index: '08',
    eyebrow: 'Zero stakes. Maximum suspense.',
    title: 'Open a box.<br><em>Change the night.</em>',
    accent: '#ffd84f',
    intro: 'Crack open party privileges, harmless dares, and match-night advantages. Nothing to buy. Nothing to lose but dignity.',
    controls: `<label class="tool-field"><span>Drop collection</span><select data-pack>${Object.entries(packs).map(([id, pack]) => `<option value="${id}">${pack.label}</option>`).join('')}</select></label>
      <div class="loot-odds" aria-label="Drop rarity odds"><span><i class="rare-dot rare"></i>Rare 16%</span><span><i class="rare-dot epic"></i>Epic 8%</span><span><i class="rare-dot legendary"></i>Legendary 2%</span></div>
      <button class="tool-action loot-open-action" type="button" data-open><span>Open party crate</span><kbd>Space</kbd></button>`,
    stage: `<div class="loot-stage">
        <div class="loot-marker" aria-hidden="true"></div>
        <div class="loot-reel-window" aria-hidden="true"><div class="loot-reel" data-reel></div></div>
        <button class="loot-crate" type="button" data-crate aria-label="Open party crate">
          <span class="loot-light"></span><i class="loot-lid"></i><i class="loot-case"><b>?</b><em>SHUFFLEWORKS<br>PARTY DROP</em></i>
        </button>
        <article class="loot-reveal" data-reveal aria-live="polite">
          <span class="loot-rarity">Ready</span><i>?</i><h2>Party crate</h2><p>Tap the crate or use the button to open it.</p>
        </article>
      </div>
      <div class="tool-outcome loot-history"><span>Recent drops</span><div data-history></div></div>`,
  })

  const packSelect = root.querySelector<HTMLSelectElement>('[data-pack]')!
  const openButton = root.querySelector<HTMLButtonElement>('[data-open]')!
  const crate = root.querySelector<HTMLButtonElement>('[data-crate]')!
  const stage = root.querySelector<HTMLElement>('.loot-stage')!
  const reel = root.querySelector<HTMLElement>('[data-reel]')!
  const reveal = root.querySelector<HTMLElement>('[data-reveal]')!
  const historyElement = root.querySelector<HTMLElement>('[data-history]')!

  const renderHistory = () => {
    historyElement.innerHTML = history.length
      ? history.map((item) => `<span class="loot-history-item rarity-${item.rarity.toLowerCase()}"><i>${item.icon}</i><b>${item.name}</b><em>${item.rarity}</em></span>`).join('')
      : '<p>No crates opened yet.</p>'
  }

  const open = () => {
    if (opening) return
    opening = true
    openButton.disabled = true
    packSelect.disabled = true

    const currentPack = packs[packSelect.value]
    const result = chooseWeighted(currentPack.drops)
    const reelDrops = Array.from({ length: 18 }, () => currentPack.drops[randomInt(currentPack.drops.length)])
    reelDrops[15] = result
    reel.innerHTML = reelDrops.map((item, index) => dropTile(item, index)).join('')
    reel.style.transition = 'none'
    reel.style.transform = 'translate3d(0,0,0)'
    stage.dataset.rarity = result.rarity.toLowerCase()
    stage.classList.remove('is-open', 'is-opening')
    reveal.className = 'loot-reveal'
    void stage.offsetWidth
    stage.classList.add('is-opening')
    reel.style.transition = 'transform 3.65s cubic-bezier(.08,.72,.12,1)'
    reel.style.transform = 'translate3d(calc(-15 * var(--loot-step) + var(--loot-center)),0,0)'

    window.setTimeout(() => {
      stage.classList.remove('is-opening')
      stage.classList.add('is-open')
      reveal.className = `loot-reveal rarity-${result.rarity.toLowerCase()}`
      reveal.innerHTML = `<span class="loot-rarity">${result.rarity} drop</span><i>${result.icon}</i><h2>${result.name}</h2><p>${result.description}</p>`
      history = [result, ...history].slice(0, 5)
      saveLocal(STORAGE_KEY, history)
      renderHistory()
      page.announcement.textContent = `${result.rarity} drop: ${result.name}. ${result.description}`
      opening = false
      openButton.disabled = false
      packSelect.disabled = false
    }, 3820)
  }

  openButton.addEventListener('click', open)
  crate.addEventListener('click', open)
  packSelect.addEventListener('change', () => {
    const selected = packs[packSelect.value]
    reveal.className = 'loot-reveal'
    reveal.innerHTML = `<span class="loot-rarity">Collection selected</span><i>?</i><h2>${selected.label}</h2><p>Open the crate to reveal your drop.</p>`
    stage.classList.remove('is-open')
  })
  renderHistory()
}

function drop(name: string, description: string, rarity: Rarity, icon: string): Drop {
  return { name, description, rarity, icon }
}

function chooseWeighted(items: Drop[]) {
  const weighted = items.map((item) => ({ item, weight: rarityWeight[item.rarity] / items.filter((candidate) => candidate.rarity === item.rarity).length }))
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = randomInt(1_000_000) / 1_000_000 * total
  for (const entry of weighted) {
    roll -= entry.weight
    if (roll < 0) return entry.item
  }
  return weighted.at(-1)!.item
}

function dropTile(item: Drop, index: number) {
  return `<i class="loot-tile rarity-${item.rarity.toLowerCase()}" style="--loot-index:${index}"><b>${item.icon}</b><span>${item.name}</span><em>${item.rarity}</em></i>`
}
