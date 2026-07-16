import type { ShuffleResult } from '../engine/types'
import type { AppShell } from './types'

export function createShell(root: HTMLElement): AppShell {
  root.innerHTML = `
    <div class="app-shell">
      <main>
        <section class="experience" aria-labelledby="hero-title">
          <header class="topbar">
            <button class="brand" type="button" data-shuffle aria-label="Shuffle again">
              <span class="brand-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
              <strong>Shuffleworks</strong>
            </button>
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

        <section class="next-mode" aria-label="Upcoming shuffle mode">
          <div class="mode-number">02</div>
          <div class="die" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div><p class="eyebrow">Next physical system</p><h2>Throw something<br>with weight.</h2><p>Dice are entering the lab.</p></div>
          <span class="soon">In development</span>
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
    setReady() { root.classList.add('is-ready') },
    setShuffling(active) {
      root.classList.toggle('is-shuffling', active)
      buttons.forEach((button) => { button.disabled = active })
      const label = root.querySelector('.shuffle span')
      if (label) label.textContent = active ? 'Colors in flight…' : 'Shuffle spectrum'
    },
    renderResult(result: ShuffleResult) {
      drawCount += 1
      count.textContent = String(drawCount).padStart(2, '0')
      resultGrid.innerHTML = result.groups.map((group, index) => `
        <article>
          <header><span>0${index + 1}</span><p>${group.label}</p></header>
          <ul>${group.items.map((item) => `<li><i style="--item-color:${item.color}"></i><b>${item.label}</b></li>`).join('')}</ul>
        </article>`).join('')
      announcement.textContent = result.announcement
    },
    onShuffle(handler) { buttons.forEach((button) => button.addEventListener('click', handler)) },
  }
}
