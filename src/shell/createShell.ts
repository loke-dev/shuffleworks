import type { ShuffleResult } from '../engine/types'
import type { AppShell } from './types'

export function createShell(root: HTMLElement): AppShell {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" type="button" data-shuffle aria-label="Shuffle again">
          <span class="brand-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
          <span><strong>Shuffleworks</strong><small>Beautiful ways to leave it to chance</small></span>
        </button>
        <div class="status"><i></i><span>Team shuffle</span><b>01</b></div>
      </header>

      <main>
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="eyebrow"><span>Mode 01</span> Team draw</p>
            <h1 id="hero-title">Make chance<br><em>feel tangible.</em></h1>
            <p class="lede">Four kinetic glass cards. Two teams. One satisfying answer.</p>
          </div>

          <div class="stage-wrap">
            <div class="stage-frame">
              <div class="zones" aria-hidden="true">
                <div class="zone zone-a"><span>Team one</span><b>01</b></div>
                <div class="zone zone-b"><span>Team two</span><b>02</b></div>
              </div>
              <div class="stage-poster" aria-hidden="true">
                <i style="--c:#ffd84f"></i><i style="--c:#a974ff"></i>
                <i style="--c:#38a0ff"></i><i style="--c:#ff625b"></i>
              </div>
              <canvas aria-label="Interactive 3D team shuffle"></canvas>
              <div class="versus" aria-hidden="true"><span>VS</span></div>
              <p class="render-label">Realtime glass · WebGL</p>
            </div>

            <div class="controls">
              <button class="shuffle" type="button" data-shuffle>
                <i aria-hidden="true">↝</i><span>Shuffle teams</span><kbd>Space</kbd>
              </button>
              <p class="draw-count"><b>00</b><span>draws<br>this session</span></p>
            </div>
          </div>
        </section>

        <section class="results" aria-labelledby="result-title">
          <div class="section-copy">
            <p class="eyebrow"><span>Result</span> Live assignment</p>
            <h2 id="result-title">The room is split.</h2>
          </div>
          <div class="result-grid" aria-live="polite"></div>
        </section>

        <section class="next-mode" aria-label="Upcoming shuffle mode">
          <div class="die" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div><p class="eyebrow"><span>Mode 02</span> In development</p><h2>Dice, with weight.</h2><p>Physical throws, collisions, and beautifully uncertain outcomes.</p></div>
          <span class="soon">Coming next</span>
        </section>
      </main>

      <footer><span>Shuffleworks / ${new Date().getFullYear()}</span><a href="https://github.com/loke-dev/shuffleworks">Source</a></footer>
      <p class="sr-only" aria-live="assertive" data-announcement></p>
    </div>`

  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-shuffle]')]
  const resultGrid = root.querySelector<HTMLElement>('.result-grid')!
  const announcement = root.querySelector<HTMLElement>('[data-announcement]')!
  const count = root.querySelector<HTMLElement>('.draw-count b')!
  let drawCount = 0

  return {
    canvas,
    setReady() {
      root.classList.add('is-ready')
    },
    setShuffling(active) {
      root.classList.toggle('is-shuffling', active)
      buttons.forEach((button) => { button.disabled = active })
      const label = root.querySelector('.shuffle span')
      if (label) label.textContent = active ? 'Shuffling…' : 'Shuffle teams'
    },
    renderResult(result: ShuffleResult) {
      drawCount += 1
      count.textContent = String(drawCount).padStart(2, '0')
      resultGrid.innerHTML = result.groups.map((group, index) => `
        <article>
          <span>0${index + 1}</span>
          <div><p>${group.label}</p><ul>${group.items.map((item) => `
            <li><i style="--item-color:${item.color}"></i>${item.label}</li>`).join('')}</ul></div>
        </article>`).join('')
      announcement.textContent = result.announcement
    },
    onShuffle(handler) {
      buttons.forEach((button) => button.addEventListener('click', handler))
    },
  }
}
