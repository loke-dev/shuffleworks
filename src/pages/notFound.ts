import { brandMarkup, footerMarkup, navigationMarkup } from '../shell/shared'

export function renderNotFound(root: HTMLElement) {
  document.title = 'Not found — Shuffleworks'
  root.innerHTML = `<div class="app-shell landing-shell">
    <header class="landing-header">${brandMarkup()}${navigationMarkup()}</header>
    <main class="not-found"><p class="eyebrow">404 / Lost roll</p><h1>This outcome<br>doesn’t exist.</h1><a class="primary-link" href="/"><span>Back home</span><i>↗</i></a></main>
    ${footerMarkup(new Date().getFullYear())}
  </div>`
}
