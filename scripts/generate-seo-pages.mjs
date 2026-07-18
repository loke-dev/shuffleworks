import { readFile, writeFile } from 'node:fs/promises'
import pages from '../seo-pages.json' with { type: 'json' }

const origin = 'https://shuffle.loke.dev'
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')

for (const page of pages) {
  const html = renderHead(template, page)
  const target = page.path === '/' ? new URL('../dist/index.html', import.meta.url) : new URL(`../dist${page.path}.html`, import.meta.url)
  await writeFile(target, html)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url><loc>${origin}${page.path}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(new URL('../dist/sitemap.xml', import.meta.url), sitemap)

function renderHead(html, page) {
  const canonical = `${origin}${page.path}`
  const image = `${origin}${page.image}`
  const schema = page.id === 'home'
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Shuffleworks', url: `${origin}/`, description: page.description },
          applicationFor(page),
          { '@type': 'ItemList', name: 'Shuffleworks randomizer tools', itemListElement: pages.filter((item) => item.id !== 'home').map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: `${origin}${item.path}` })) },
        ],
      }
    : { '@context': 'https://schema.org', ...applicationFor(page), isPartOf: { '@id': `${origin}/#website` } }

  const seo = `<meta name="description" content="${escapeAttribute(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Shuffleworks" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${escapeAttribute(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${escapeAttribute(page.name)} preview" />
    <meta property="og:image:width" content="1000" />
    <meta property="og:image:height" content="760" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(page.name)} preview" />
    <script type="application/ld+json" data-seo-schema>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, `<!-- seo:start -->\n    ${seo}\n    <!-- seo:end -->`)
}

function applicationFor(page) {
  const url = `${origin}${page.path}`
  return {
    '@type': 'WebApplication', '@id': `${url}#app`, name: page.name, url, description: page.description,
    image: `${origin}${page.image}`, applicationCategory: page.category, operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
}

function escapeAttribute(value) { return escapeHtml(value).replace(/"/g, '&quot;') }
function escapeHtml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
