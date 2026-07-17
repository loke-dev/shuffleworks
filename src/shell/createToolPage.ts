import { brandMarkup, footerMarkup, navigationMarkup } from './shared'

export type ToolPageOptions = {
  id: string
  index: string
  eyebrow: string
  title: string
  accent: string
  intro: string
  controls: string
  stage: string
}

export function createToolPage(root: HTMLElement, options: ToolPageOptions) {
  root.innerHTML = `<div class="app-shell tool-shell" style="--tool-accent:${options.accent}">
    <header class="landing-header">${brandMarkup()}${navigationMarkup(options.id)}</header>
    <main>
      <section class="tool-hero">
        <div class="tool-index"><span>${options.index}</span><b>${options.id}</b></div>
        <div class="tool-stage" data-tool-stage>${options.stage}</div>
        <aside class="tool-controls">${options.controls}</aside>
        <div class="tool-heading"><p class="eyebrow">${options.eyebrow}</p><h1>${options.title}</h1><p>${options.intro}</p></div>
      </section>
    </main>
    ${footerMarkup(new Date().getFullYear())}
    <p class="sr-only" aria-live="assertive" data-announcement></p>
  </div>`
  return {
    stage: root.querySelector<HTMLElement>('[data-tool-stage]')!,
    announcement: root.querySelector<HTMLElement>('[data-announcement]')!,
  }
}
