# AGENTS.md

## Commands

```bash
npm run dev           # dev server at http://localhost:5173
npm run build         # vue-tsc typecheck then vite build (must pass both)
npm run preview       # serve dist/ at http://localhost:4173
```

E2E tests require a built preview server — always build first:

```bash
npm run build && npx playwright test                          # all tests
npx playwright test tests/build-product.spec.ts               # single file
```

There are no unit tests — only Playwright E2E tests in `tests/`.

## Key conventions

- **All Vue components use `defineComponent` + Composition API returning JSX render functions.** No `<template>` or Options API templates exist anywhere. When creating or editing components, follow this pattern.
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (not v3 with PostCSS). No `tailwind.config.*` file.
- **`@` path alias** resolves to `src/` (configured in `vite.config.ts`).
- **Vite `base` is `'./'`** (relative paths in dist) — the app is meant to be embedded, not served from a root domain.
- **Hash-based routing** (`createWebHashHistory`) — routes are `#/editor` and `#/preview`, default redirects to editor.
- **Element Plus** is imported globally in `main.ts` but only actually used in `NodeInfoPopover` for form components and popover.

## Architecture

Single-page app with two modes under `WorkspaceLayout`:

- **Editor** (`#/editor`): `useDslStore` holds nested `DslNode[]` tree → `WireframeRenderer` flattens/culls/scales it → `NodeBlock` click opens `NodeInfoPopover` for metadata editing.
- **Preview** (`#/preview`): `usePreviewStore` holds iframe src, hexData, svgMap → `IframePanel` loads URL or ZIP in iframe, auto-invokes `window.runPlugin()` when `_FicAppObj` appears (Pixso integration).

`useWindowBridge` (initialized in `App.tsx`) exposes `window.uploadDsl()`, `window.downloadDsl()`, `window.uploadZip()` for host WebView integration. It also receives `postMessage` from parent (`NODE_DSL_JSON`, `NODE_DSL_CLEAR`).

When embedded as an iframe, `updateNodeMeta` in `useDslStore` posts `DSL_NODE_UPDATED` back to `window.parent` with `{ nid, changes: { layerType, layerName, layerDescription } }`. Message types are documented in `src/types/window.d.ts` (`PostMessageEvent`).

DSL node schema is in `src/types/dsl.ts`. Key fields: `nid`, `rect`, `layerType` (frame|component|text|image|icon), `passthrough`, `children`. Wireframe colors are hardcoded in `src/components/WireframeRenderer/colors.ts`.

## Verification

Before considering work done, run:

```bash
npm run build   # catches type errors and build failures
```
