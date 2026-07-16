import { brandMarkup, footerMarkup, navigationMarkup } from '../shell/shared'

export function renderHome(root: HTMLElement) {
  document.title = 'Shuffleworks — Beautiful ways to leave it to chance'
  root.innerHTML = `<div class="app-shell landing-shell">
    <header class="landing-header">${brandMarkup()}${navigationMarkup()}</header>
    <main>
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-orbit" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p class="eyebrow">A digital physics lab for chance</p>
        <h1 id="landing-title">Make chance<br><em>feel tangible.</em></h1>
        <p class="landing-lede">Beautiful, tactile tools for splitting teams, rolling dice, and settling the small decisions that make game night move.</p>
        <a class="primary-link" href="/colors"><span>Start shuffling</span><i>↗</i></a>
      </section>

      <section class="mode-library" aria-labelledby="modes-title">
        <header><p class="eyebrow">Choose an instrument</p><h2 id="modes-title">Two ways to<br>leave it to chance.</h2></header>
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
