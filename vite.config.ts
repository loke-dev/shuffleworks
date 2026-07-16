import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'cloudflare-rocket-loader-opt-out',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return html.replace('<script type="module"', '<script data-cfasync="false" type="module"')
        },
      },
    },
  ],
})
