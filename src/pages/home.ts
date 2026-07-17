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
          ${modeCard('/colors','01 / Spectrum','Shuffle colors','colors','Four glass cards resolve into two unmistakable teams.')}
          ${modeCard('/dice','02 / Polyhedra','Roll the room','dice','Choose your dice, set the count, and give uncertainty some weight.')}
          ${modeCard('/wheel','03 / Momentum','Spin a wheel','wheel','Custom choices with weight, color, and a physical stop.')}
          ${modeCard('/coin','04 / Flip','Flip coins','coin','One coin or a handful, tossed together in polished metal.')}
          ${modeCard('/teams','05 / People','Make teams','teams','Enter names and distribute everyone across two or more teams.')}
          ${modeCard('/cards','06 / Deck','Draw cards','cards','Shuffle a full deck and deal without replacement.')}
          ${modeCard('/rps','07 / Duel','Rock paper scissors','rps','The fastest classic decider, rendered as a head-to-head throw.')}
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

function modeCard(href:string,index:string,title:string,preview:string,copy:string){return `<a class="mode-card" href="${href}"><span class="mode-card-index">${index}</span><figure class="mode-preview" aria-hidden="true"><img src="/previews/${preview}.jpg" alt="" loading="lazy" decoding="async"></figure><div><h3>${title}</h3><p>${copy}</p></div><b>Open mode ↗</b></a>`}

function launchLink(href:string,index:string,label:string,symbol:string){return `<a href="${href}"><span>${index}</span><i aria-hidden="true">${symbol}</i><b>${label}</b><em>↗</em></a>`}
