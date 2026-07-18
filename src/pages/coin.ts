import { loadLocal, randomInt, saveLocal } from '../lib/random'
import { createToolPage } from '../shell/createToolPage'

type CoinSide = 'H' | 'T'

const HISTORY_KEY = 'shuffleworks:coin-history:v1'
const STREAK_KEY = 'shuffleworks:coin-streak:v1'
const MAX_HISTORY = 5

const sideName = (side: CoinSide) => side === 'H' ? 'Heads' : 'Tails'

export function renderCoin(root: HTMLElement) {
  document.title = 'Coin flip — Shuffleworks'
  const stored = loadLocal<CoinSide[]>(HISTORY_KEY, [])
  let history = Array.isArray(stored) ? stored.filter((side): side is CoinSide => side === 'H' || side === 'T').slice(0, MAX_HISTORY) : []
  const storedStreak = loadLocal<{ side: CoinSide, count: number } | null>(STREAK_KEY, null)
  let currentStreak = storedStreak && (storedStreak.side === 'H' || storedStreak.side === 'T') && storedStreak.count > 0
    ? storedStreak
    : deriveStreak(history)

  const page = createToolPage(root, {
    id: 'coin',
    index: '04',
    eyebrow: 'A decisive metal toss',
    title: 'Let it<br><em>land.</em>',
    accent: '#ffd84f',
    intro: 'One coin, one call. Build a streak and keep the last five flips in view.',
    controls: '<div class="coin-control-copy"><span>Single coin mode</span><b data-control-streak>No streak yet</b></div><button class="tool-action" data-flip><span>Flip coin</span><kbd>Space</kbd></button>',
    stage: '<div class="coin-game"><div class="coin-field" data-coins></div><aside class="coin-ledger"><header><span>Current streak</span><b data-streak>—</b></header><ol data-coin-history></ol></aside></div><div class="tool-outcome" data-outcome><span>Ready</span><b>Heads or tails?</b></div>',
  })
  root.querySelector('.tool-shell')?.classList.add('coin-tool')

  const field = root.querySelector<HTMLElement>('[data-coins]')!
  const outcome = root.querySelector<HTMLElement>('[data-outcome]')!
  const button = root.querySelector<HTMLButtonElement>('[data-flip]')!
  const historyList = root.querySelector<HTMLOListElement>('[data-coin-history]')!
  const streakLabel = root.querySelector<HTMLElement>('[data-streak]')!
  const controlStreak = root.querySelector<HTMLElement>('[data-control-streak]')!
  let flipping = false
  let settleTimer = 0

  const renderStats = () => {
    streakLabel.textContent = currentStreak ? `${sideName(currentStreak.side)} × ${currentStreak.count}` : '—'
    controlStreak.textContent = currentStreak ? `${currentStreak.count} ${sideName(currentStreak.side).toLowerCase()} in a row` : 'No streak yet'
    historyList.innerHTML = Array.from({ length: MAX_HISTORY }, (_, index) => {
      const side = history[index]
      return side
        ? `<li data-side="${side}"><i>${side}</i><span>${sideName(side)}</span><small>${index === 0 ? 'Latest' : `−${index}`}</small></li>`
        : `<li class="coin-history-slot"><i>·</i><span>Waiting</span><small>—</small></li>`
    }).join('')
  }

  const renderCoin = (result: CoinSide = history[0] ?? 'H') => {
    const heads = '<b class="coin-emblem coin-portrait" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="18"/><path d="M21 84c3-22 14-34 29-34s26 12 29 34z"/></svg></b>'
    const tails = '<b class="coin-emblem coin-compass" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 9 60 38 91 50 60 61 50 91 39 61 9 50 39 38z"/><circle cx="50" cy="50" r="12"/></svg></b>'
    field.innerHTML = `<button type="button" class="coin-object" data-result="${result}" aria-label="Flip coin">
      <span class="coin-body">
        <span class="coin-face coin-front">${heads}</span>
        <span class="coin-face coin-back">${tails}</span>
        <span class="coin-edge" aria-hidden="true"></span>
      </span>
    </button>`
  }

  const flip = () => {
    if (flipping) return
    flipping = true
    const result: CoinSide = randomInt(2) ? 'H' : 'T'
    field.classList.remove('is-flipping')
    renderCoin(result)
    void field.offsetWidth
    field.classList.add('is-flipping')
    button.disabled = true
    outcome.innerHTML = '<span>In the air</span><b>Calling it…</b>'

    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      window.clearTimeout(settleTimer)
      history = [result, ...history].slice(0, MAX_HISTORY)
      currentStreak = currentStreak?.side === result ? { side: result, count: currentStreak.count + 1 } : { side: result, count: 1 }
      saveLocal(HISTORY_KEY, history)
      saveLocal(STREAK_KEY, currentStreak)
      renderStats()
      outcome.innerHTML = `<span>Landed</span><b>${sideName(result)}</b>`
      page.announcement.textContent = `${sideName(result)}. ${controlStreak.textContent}.`
      flipping = false
      button.disabled = false
    }

    field.querySelector('.coin-object')?.addEventListener('animationend', settle, { once: true })
    settleTimer = window.setTimeout(settle, 1970)
  }

  button.addEventListener('click', flip)
  field.addEventListener('click', (event) => { if ((event.target as Element).closest('.coin-object')) flip() })
  renderCoin()
  renderStats()
}

function deriveStreak(history: CoinSide[]) {
  if (!history.length) return null
  const side = history[0]
  let count = 1
  while (history[count] === side) count += 1
  return { side, count }
}
