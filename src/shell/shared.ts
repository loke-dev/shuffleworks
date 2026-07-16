export function brandMarkup() {
  return `<a class="brand" href="/" aria-label="Shuffleworks home">
    <span class="brand-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
    <strong>Shuffleworks</strong>
  </a>`
}

export function navigationMarkup(active?: string) {
  const core = [['colors','Colors'],['dice','Dice'],['wheel','Wheel']]
  const extras: Record<string,string> = { coin:'Coin', teams:'Teams', cards:'Cards', rps:'RPS' }
  const links = active && extras[active] ? [...core, [active, extras[active]]] : core
  return `<nav class="site-nav" aria-label="Shuffle modes">
    ${links.map(([id,label])=>`<a href="/${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
  </nav>`
}

export function footerMarkup(year: number) {
  return `<footer><span>Shuffleworks / ${year}</span><a href="https://github.com/loke-dev/shuffleworks">Source</a></footer>`
}
