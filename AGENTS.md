# Shuffleworks repository instructions

Shuffleworks is a framework-free Vite, TypeScript, and Three.js application
deployed as a static Cloudflare Pages site.

- Use the pnpm version declared in `package.json`; do not introduce another
  package manager or a UI framework.
- Keep shared navigation and metadata in `src/router.ts` and `src/seo.ts`.
- Keep route metadata in `seo-pages.json` synchronized with user-facing modes.
  The production build generates the matching static pages.
- Preserve touch input, keyboard accessibility, reduced-motion behavior,
  responsive layouts, and Three.js resource cleanup.
- Treat `src/`, `public/`, `index.html`, and `seo-pages.json` as sources. Do not
  edit generated `dist/` or Wrangler state.
- Run `pnpm typecheck` and `pnpm build` for code, content, or configuration
  changes.
- Use `pnpm deploy` only when the task explicitly requires a manual deployment.
- Never commit credentials, local environment files, or Cloudflare state.
