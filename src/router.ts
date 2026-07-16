export type RouteId = 'home' | 'colors' | 'dice' | 'not-found'

export function resolveRoute(pathname: string): RouteId {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/colors') return 'colors'
  if (path === '/dice') return 'dice'
  return 'not-found'
}
