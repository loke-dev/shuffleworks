import { brandMarkup, footerMarkup, navigationMarkup } from './shared'

export function createAppMarkup(year: number) {
  return `
    <div class="app-shell">
      <main>
        <section class="experience" aria-labelledby="hero-title">
          <header class="topbar">
            ${brandMarkup()}
            ${navigationMarkup('colors')}
            <div class="mode-index"><span>Spectrum</span><b>01</b></div>
          </header>

          <div class="scene-copy">
            <p class="eyebrow">A kinetic team draw</p>
            <h1 id="hero-title">Let the colors<br><em>find their side.</em></h1>
          </div>

          <div class="world">
            <div class="aurora" aria-hidden="true"></div>
            <div class="stage-poster" aria-hidden="true">
              <i style="--c:#ffd84f"></i><i style="--c:#a974ff"></i>
              <i style="--c:#38a0ff"></i><i style="--c:#ff625b"></i>
            </div>
            <canvas aria-label="Interactive 3D color shuffle"></canvas>
            <div class="axis axis-a" aria-hidden="true"><span>01</span><b>Team one</b></div>
            <div class="axis axis-b" aria-hidden="true"><span>02</span><b>Team two</b></div>
            <div class="versus" aria-hidden="true"><span>VS</span></div>
            <p class="render-label">Realtime glass / WebGL</p>
          </div>

          <div class="action-rail">
            <p class="instruction">Press anywhere to redraw the room</p>
            <button class="shuffle" type="button" data-shuffle>
              <i aria-hidden="true">↝</i><span>Shuffle spectrum</span><kbd>Space</kbd>
            </button>
            <p class="draw-count"><b>00</b><span>draws</span></p>
          </div>
        </section>

        <section class="manifest" aria-labelledby="result-title">
          <div class="manifest-copy">
            <p class="eyebrow">The current alignment</p>
            <h2 id="result-title">Two sides,<br>no debate.</h2>
          </div>
          <div class="result-grid" aria-live="polite"></div>
        </section>

        <section class="field-notes" aria-labelledby="notes-title">
          <div>
            <p class="eyebrow">Designed for game night</p>
            <h2 id="notes-title">Chance should feel physical.</h2>
          </div>
          <div class="note-grid">
            <article><span>01</span><div><h3>Track every color</h3><p>The deck stays legible through the full shuffle, so the result feels earned instead of arbitrary.</p></div></article>
            <article><span>02</span><div><h3>One tap, fair teams</h3><p>Four colors resolve into two balanced sides—perfect for FIFA, couch tournaments, and quick decisions.</p></div></article>
            <article><span>03</span><div><h3>A growing physics lab</h3><p>Spectrum is the first mode. Dice, draws, and new tactile ways to leave things to chance come next.</p></div></article>
          </div>
        </section>

        <section class="next-mode" aria-label="Upcoming shuffle mode">
          <div class="mode-number">02</div>
          <div class="die" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div><p class="eyebrow">Next physical system</p><h2>Throw something<br>with weight.</h2><p>Dice are entering the lab.</p></div>
          <span class="soon">In development</span>
        </section>
      </main>

      ${footerMarkup(year)}
      <p class="sr-only" aria-live="assertive" data-announcement></p>
    </div>`
}
