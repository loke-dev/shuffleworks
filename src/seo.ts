import pages from '../seo-pages.json'
import type { RouteId } from './router'

const ORIGIN = 'https://shuffle.loke.dev'

type SeoPage = (typeof pages)[number]

export function applySeo(route: RouteId) {
  const page = pages.find((candidate) => candidate.id === route)
  if (!page) {
    document.title = 'Page not found — Shuffleworks'
    setMeta('name', 'robots', 'noindex, follow')
    setLink('canonical', `${ORIGIN}${window.location.pathname}`)
    document.querySelector('[data-seo-schema]')?.remove()
    return
  }

  const canonical = `${ORIGIN}${page.path}`
  const image = `${ORIGIN}${page.image}`
  document.title = page.title
  setMeta('name', 'description', page.description)
  setMeta('name', 'robots', 'index, follow, max-image-preview:large')
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', 'Shuffleworks')
  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:image:alt', `${page.name} preview`)
  setMeta('property', 'og:image:width', '1000')
  setMeta('property', 'og:image:height', '760')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)
  setMeta('name', 'twitter:image', image)
  setMeta('name', 'twitter:image:alt', `${page.name} preview`)
  setLink('canonical', canonical)
  setSchema(page)
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.append(meta)
  }
  meta.content = content
}

function setLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.append(link)
  }
  link.href = href
}

function setSchema(page: SeoPage) {
  let script = document.head.querySelector<HTMLScriptElement>('[data-seo-schema]')
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seoSchema = ''
    document.head.append(script)
  }
  script.textContent = JSON.stringify(schemaFor(page))
}

export function schemaFor(page: SeoPage) {
  const url = `${ORIGIN}${page.path}`
  const application = {
    '@type': 'WebApplication',
    '@id': `${url}#app`,
    name: page.name,
    url,
    description: page.description,
    image: `${ORIGIN}${page.image}`,
    applicationCategory: page.category,
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
  return page.id === 'home'
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: 'Shuffleworks', url: `${ORIGIN}/`, description: page.description },
          application,
          {
            '@type': 'ItemList',
            name: 'Shuffleworks randomizer tools',
            itemListElement: pages.filter((item) => item.id !== 'home').map((item, index) => ({
              '@type': 'ListItem', position: index + 1, name: item.name, url: `${ORIGIN}${item.path}`,
            })),
          },
        ],
      }
    : { '@context': 'https://schema.org', ...application, isPartOf: { '@id': `${ORIGIN}/#website` } }
}
