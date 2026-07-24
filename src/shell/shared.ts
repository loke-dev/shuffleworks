export function brandMarkup() {
  return `<a class="brand" href="/" aria-label="Shuffleworks home">
    <span class="brand-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
    <strong>Shuffleworks</strong>
  </a>`
}

export function navigationMarkup(active?: string) {
  const links = [
    ['colors', 'Colors'],
    ['dice', 'Dice'],
    ['wheel', 'Wheel'],
    ['coin', 'Coin'],
    ['teams', 'Teams'],
    ['cards', 'Cards'],
    ['rps', 'RPS'],
    ['party', 'Party'],
  ]
  return `<details class="nav-menu" open>
    <summary class="nav-toggle">
      <span class="sr-only">Shuffle modes</span>
      <i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>
    </summary>
    <nav class="site-nav" aria-label="Shuffle modes">
      ${links.map(([id,label])=>`<a href="/${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
  </details>`
}

export function initializeNavigation() {
  const menus = document.querySelectorAll<HTMLDetailsElement>('.nav-menu')
  const mobileNavigation = window.matchMedia('(max-width: 760px)')

  const syncNavigation = () => menus.forEach((menu) => { menu.open = !mobileNavigation.matches })
  const closeMenus = () => {
    if (mobileNavigation.matches) menus.forEach((menu) => { menu.open = false })
  }

  syncNavigation()
  mobileNavigation.addEventListener('change', syncNavigation)

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenus()
  })

  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !Array.from(menus).some((menu) => menu.contains(event.target as Node))) {
      closeMenus()
    }
  })

  menus.forEach((menu) => {
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenus))
  })
}

export function footerMarkup(year: number) {
  return `<footer><span>Shuffleworks / ${year}</span><a href="https://github.com/loke-dev/shuffleworks">Source</a></footer>`
}
