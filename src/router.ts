export type RouteId = 'home' | 'colors' | 'dice' | 'wheel' | 'coin' | 'teams' | 'cards' | 'rps' | 'party' | 'lootbox' | 'not-found'

export function resolveRoute(pathname: string): RouteId {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/colors') return 'colors'
  if (path === '/dice') return 'dice'
  if (path === '/wheel') return 'wheel'
  if (path === '/coin') return 'coin'
  if (path === '/teams') return 'teams'
  if (path === '/cards') return 'cards'
  if (path === '/rps') return 'rps'
  if (path === '/party') return 'party'
  if (path === '/lootbox') return 'lootbox'
  return 'not-found'
}
