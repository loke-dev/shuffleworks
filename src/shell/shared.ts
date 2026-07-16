export function brandMarkup() {
  return `<a class="brand" href="/" aria-label="Shuffleworks home">
    <span class="brand-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
    <strong>Shuffleworks</strong>
  </a>`
}

export function navigationMarkup(active?: string) {
  return `<nav class="site-nav" aria-label="Shuffle modes">
    <a href="/colors" ${active === 'colors' ? 'aria-current="page"' : ''}>Colors</a>
    <a href="/dice" ${active === 'dice' ? 'aria-current="page"' : ''}>Dice</a>
  </nav>`
}

export function footerMarkup(year: number) {
  return `<footer><span>Shuffleworks / ${year}</span><a href="https://github.com/loke-dev/shuffleworks">Source</a></footer>`
}
