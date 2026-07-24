import { brandMarkup, footerMarkup, navigationMarkup } from '../shell/shared'

const plannedGames = [
  {
    state: 'Next up',
    icon: '●',
    title: 'Marble race',
    copy: 'Give every player a marble and let gravity choose the winner.',
    color: '#38a0ff',
  },
  {
    state: 'Planned',
    icon: '◇',
    title: 'Secret roles',
    copy: 'Pass the phone and privately reveal spies, impostors, and wildcards.',
    color: '#a974ff',
  },
  {
    state: 'Planned',
    icon: '↻',
    title: 'Bottle spin',
    copy: 'Put everyone around the table and give the bottle a proper throw.',
    color: '#67e8c3',
  },
  {
    state: 'Planned',
    icon: '!',
    title: 'Hot seat',
    copy: 'Pick a player, reveal a prompt, and keep the room moving.',
    color: '#ff625b',
  },
]

export function renderParty(root: HTMLElement) {
  document.title = 'Party games — Shuffleworks'
  root.innerHTML = `<div class="app-shell party-shell">
    <header class="landing-header">${brandMarkup()}${navigationMarkup('party')}</header>
    <main>
      <section class="party-hero">
        <div class="party-hero-copy">
          <p class="eyebrow">Party games / open collection</p>
          <h1>Pass the phone.<br><em>Start something.</em></h1>
          <p>Fast, tactile games built for one screen, a room full of people, and absolutely no setup.</p>
          <a class="primary-link" href="#party-games"><span>Pick a game</span><i>↓</i></a>
        </div>
        <a class="featured-party-game" href="/lootbox" aria-label="Play Party Crate">
          <span class="featured-kicker">Playable now · 01</span>
          <div class="party-crate-visual" aria-hidden="true">
            <i class="party-crate-glow"></i>
            <div class="party-crate-lid"></div>
            <div class="party-crate-body"><span>?</span></div>
          </div>
          <div><span>Party crate</span><b>Open something unexpected</b><i>↗</i></div>
        </a>
      </section>

      <section class="party-library" id="party-games" aria-labelledby="party-title">
        <header>
          <p class="eyebrow">Games for the room</p>
          <h2 id="party-title">A growing collection<br>of good trouble.</h2>
        </header>
        <div class="party-game-grid">
          <a class="party-game is-live" href="/lootbox" style="--party-color:#ffd84f">
            <span>01 / Live</span><i aria-hidden="true">▣</i><h3>Party crate</h3>
            <p>Open perks, dares, and match-night drops with escalating rarity.</p><b>Play now ↗</b>
          </a>
          <a class="party-game is-live" href="/rps" style="--party-color:#67e8c3">
            <span>02 / Live</span><i aria-hidden="true">✊</i><h3>RPS duel</h3>
            <p>Choose your throw and face the machine on the third shake.</p><b>Play now ↗</b>
          </a>
          ${plannedGames.map((game, index) => `<article class="party-game" style="--party-color:${game.color}">
            <span>${String(index + 3).padStart(2, '0')} / ${game.state}</span><i aria-hidden="true">${game.icon}</i>
            <h3>${game.title}</h3><p>${game.copy}</p><b>In the lab</b>
          </article>`).join('')}
        </div>
      </section>

      <section class="party-principle">
        <p class="eyebrow">The only rule</p>
        <p>No accounts. No purchases. No fake currency. Just a little suspense and something fun to do with the result.</p>
      </section>
    </main>
    ${footerMarkup(new Date().getFullYear())}
  </div>`
}
