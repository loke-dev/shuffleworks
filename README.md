# Shuffleworks

Beautiful, tactile shuffle tools for teams, games, and chance.

The first mode splits four color cards into two teams with a persistent Three.js scene and responsive glass materials. The application is intentionally framework-free: Vite, TypeScript, Three.js, and native HTML/CSS.

## Development

```sh
pnpm install
pnpm dev
```

## Verification

```sh
pnpm typecheck
pnpm build
```

## Deployment

The static `dist` directory deploys to the `shuffleworks` Cloudflare Pages project.

```sh
pnpm deploy
```
