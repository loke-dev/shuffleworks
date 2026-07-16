import './style.css'
import { resolveRoute } from './router'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('Shuffleworks root not found')

const route = resolveRoute(window.location.pathname)

if (route === 'home') {
  const { renderHome } = await import('./pages/home')
  renderHome(root)
} else if (route === 'colors') {
  const { renderColors } = await import('./pages/colors')
  await renderColors(root)
} else if (route === 'dice') {
  const { renderDice } = await import('./pages/dice')
  await renderDice(root)
} else {
  const { renderNotFound } = await import('./pages/notFound')
  renderNotFound(root)
}
