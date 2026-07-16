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
} else if (route === 'wheel') {
  const { renderWheel } = await import('./pages/wheel'); renderWheel(root)
} else if (route === 'coin') {
  const { renderCoin } = await import('./pages/coin'); renderCoin(root)
} else if (route === 'teams') {
  const { renderNameTeams } = await import('./pages/nameTeams'); renderNameTeams(root)
} else if (route === 'cards') {
  const { renderCards } = await import('./pages/cards'); renderCards(root)
} else if (route === 'rps') {
  const { renderRps } = await import('./pages/rps'); renderRps(root)
} else {
  const { renderNotFound } = await import('./pages/notFound')
  renderNotFound(root)
}
