import { readFile } from 'node:fs/promises'

const routerPath = new URL('../src/router.ts', import.meta.url)
const seoPagesPath = new URL('../seo-pages.json', import.meta.url)

const routerSource = await readFile(routerPath, 'utf8')
const seoPages = JSON.parse(await readFile(seoPagesPath, 'utf8'))

const routeUnionMatch = routerSource.match(/export type RouteId\s*=\s*([^]*?)(?:\n\n|$)/)
if (!routeUnionMatch) {
  throw new Error('Unable to parse RouteId declaration from src/router.ts')
}

const declaredRouteIds = [...routeUnionMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
const resolvedRoutes = [...routerSource.matchAll(/if \(path === '([^']+)'\)\s*return '([^']+)'/g)]
const resolvedRouteIds = resolvedRoutes.map(([, , id]) => id)

const seoIds = seoPages.map((page) => page.id)

const routeMap = new Map()
resolvedRoutes.forEach(([_, path, id]) => {
  if (routeMap.has(path)) {
    throw new Error(`Duplicate route path in src/router.ts: ${path}`)
  }
  routeMap.set(path, id)
})

const userFacingRouteIds = declaredRouteIds.filter((id) => id !== 'not-found').sort()
const resolvedRouteIdSet = new Set(resolvedRouteIds.filter((id) => id !== 'not-found'))
const missingFromSeo = userFacingRouteIds.filter((id) => !seoIds.includes(id))
const extraInSeo = seoIds.filter((id) => !userFacingRouteIds.includes(id))
const unresolvedIds = userFacingRouteIds.filter((id) => !resolvedRouteIdSet.has(id))

const unknownPathRoutes = seoPages
  .map((page) => {
    const routeId = routeMap.get(page.path === '/' ? '/' : page.path)
    return routeId === undefined ? { pageId: page.id, path: page.path } : null
  })
  .filter(Boolean)

const errors = []
if (missingFromSeo.length > 0) {
  errors.push(`Missing IDs in seo-pages.json: ${missingFromSeo.join(', ')}`)
}

if (extraInSeo.length > 0) {
  errors.push(`Unknown IDs in seo-pages.json with no matching RouteId: ${extraInSeo.join(', ')}`)
}

if (unresolvedIds.length > 0) {
  errors.push(`Route IDs declared but not mapped in resolveRoute(): ${unresolvedIds.join(', ')}`)
}

if (unknownPathRoutes.length > 0) {
  const lines = unknownPathRoutes.map((entry) => `${entry.path} (${entry.pageId})`).join(', ')
  errors.push(`seo-pages.json paths not present in router resolveRoute(): ${lines}`)
}

if (errors.length > 0) {
  console.error('Route/SEO synchronization failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Route/SEO synchronization check passed.')
