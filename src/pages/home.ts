import { brandMarkup, footerMarkup, navigationMarkup } from '../shell/shared'

export function renderHome(root: HTMLElement) {
  document.title = 'Shuffleworks — Beautiful ways to leave it to chance'
  root.innerHTML = `<div class="app-shell landing-shell">
    <header class="landing-header">${brandMarkup()}${navigationMarkup()}</header>
    <main>
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-copy">
          <p class="eyebrow">A digital physics lab for chance</p>
          <h1 id="landing-title">Pick a game.<br><em>Let chance move.</em></h1>
          <p class="landing-lede">Seven tactile tools for game night, quick decisions, fair teams, and every moment that is better left to chance.</p>
          <a class="primary-link" href="#modes"><span>Explore all modes</span><i>↓</i></a>
        </div>
        <nav class="mode-launcher" aria-label="Launch a shuffle mode">
          <header><span>Live instruments</span><b>07 modes</b></header>
          ${launchLink('/colors', '01', 'Colors', '◇')}
          ${launchLink('/dice', '02', 'Dice', '⚄')}
          ${launchLink('/wheel', '03', 'Wheel', '◉')}
          ${launchLink('/coin', '04', 'Coin', '◎')}
          ${launchLink('/teams', '05', 'Teams', '↗↙')}
          ${launchLink('/cards', '06', 'Cards', 'A♠')}
          ${launchLink('/rps', '07', 'RPS', '✊')}
        </nav>
      </section>

      <section class="mode-library" id="modes" aria-labelledby="modes-title">
        <header><p class="eyebrow">Choose an instrument</p><h2 id="modes-title">Seven ways to<br>leave it to chance.</h2></header>
        <div class="mode-cards">
          <a class="mode-card mode-card-colors" href="/colors">
            <span class="mode-card-index">01 / Spectrum</span>
            <div class="mini-deck" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <div><h3>Shuffle colors</h3><p>Four glass cards resolve into two unmistakable teams.</p></div><b>Open mode ↗</b>
          </a>
          <a class="mode-card mode-card-dice" href="/dice">
            <span class="mode-card-index">02 / Polyhedra</span>
            <div class="mini-die" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <div><h3>Roll the room</h3><p>Choose your dice, set the count, and give uncertainty some weight.</p></div><b>Open mode ↗</b>
          </a>
          ${modeCard('/wheel','03 / Momentum','Spin a wheel','◉','Custom choices with weight, color, and a physical stop.')}
          ${modeCard('/coin','04 / Flip','Flip coins','◎','One coin or a handful, tossed together in polished metal.')}
          ${modeCard('/teams','05 / People','Make teams','↗↙','Enter names and distribute everyone across two or more teams.')}
          ${modeCard('/cards','06 / Deck','Draw cards','A♠','Shuffle a full deck and deal without replacement.')}
          ${modeCard('/rps','07 / Duel','Rock paper scissors','✊','The fastest classic decider, rendered as a head-to-head throw.')}
        </div>
      </section>

      <section class="landing-manifesto">
        <p class="eyebrow">Built to grow</p>
        <p>One lean foundation. Many physical systems. Cards and dice are only the beginning.</p>
        <div><span>WebGL</span><span>Mobile first</span><span>No accounts</span><span>Instant outcomes</span></div>
      </section>
    </main>
    ${footerMarkup(new Date().getFullYear())}
  </div>`
}

function modeCard(href:string,index:string,title:string,symbol:string,copy:string){return `<a class="mode-card" href="${href}"><span class="mode-card-index">${index}</span><i class="mode-card-symbol" aria-hidden="true">${symbol}</i><div><h3>${title}</h3><p>${copy}</p></div><b>Open mode ↗</b></a>`}

function launchLink(href:string,index:string,label:string,symbol:string){return `<a href="${href}"><span>${index}</span><i aria-hidden="true">${symbol}</i><b>${label}</b><em>↗</em></a>`}
