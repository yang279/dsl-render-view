# AGENTS.md

## Commands

```bash
npm run dev           # dev server at http://localhost:5173
npm run build         # vue-tsc -b typecheck then vite build (must pass both)
npm run preview       # serve dist/ at http://localhost:4173
```

E2E tests require a built preview server — always build first:

```bash
npm run build && npx playwright test                          # all tests
npx playwright test tests/build-product.spec.ts               # single file
npx playwright test tests/upload-zip.spec.ts                  # requires test-output-new.zip in repo root
```

No unit tests — only Playwright E2E in `tests/`. The `upload-zip` spec depends on `test-output-new.zip` at repo root.

## Key conventions

- **Vue JSX, not React JSX.** `jsxImportSource: "vue"` in tsconfig. Components use `defineComponent` + Composition API returning JSX render functions — no `<template>` or Options API. Use Vue JSX semantics (`v-model`, `v-show`, slot props via `v-slots`) not React patterns.
- **Strict TS checks** in `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`. Unused imports/vars or non-erasable syntax (like `enum`) will break the build.
- **Tailwind CSS 4** via `@tailwindcss/vite` (not v3 PostCSS). No `tailwind.config.*`. Entry is `src/style.css` with `@import "tailwindcss"`.
- **`@` path alias** → `src/` (vite.config.ts + tsconfig paths).
- **Vite `base: './'`** — relative paths in dist; app is meant to be embedded, not served from a root domain.
- **Hash-based routing** (`createWebHashHistory`) — `#/editor` and `#/preview`, default redirects to editor.
- **Element Plus** imported globally in `main.ts` but only used in `NodeInfoPopover` for form components and popover.
- **Pinia store IDs** are `'dsl'` and `'preview'` — referenced by name in tests and composables.

## Architecture

Single-page app with two modes under `WorkspaceLayout`:

- **Editor** (`#/editor`): `useDslStore` holds nested `DslNode[]` tree → `WireframeRenderer` flattens/culls → `NodeBlock` click opens `NodeInfoPopover` for metadata editing.
- **Preview** (`#/preview`): `usePreviewStore` holds iframe src, hexData, svgMap → `IframePanel` loads URL or ZIP in iframe, auto-invokes `window.runPlugin()` when `_FicAppObj` appears (Pixso integration).

### Window bridge

`useWindowBridge` (initialized in `App.tsx`) exposes for host WebView:
- `window.uploadDsl()`, `window.downloadDsl()`, `window.uploadZip()` — file picker integration
- `window.uploadDslToPipeline()`, `window.clearDsl()` — pipeline integration
- Receives `postMessage` from parent: `NODE_DSL_JSON`, `NODE_DSL_CLEAR`, `NODE_DSL_PIPELINE`, `PIPELINE_ZIP_DATA`
- `NODE_DSL_PIPELINE` calls remote dsl-to-hex API; success returns `PIPELINE_LOADED { success: true, zipData: ArrayBuffer }`, any failure returns `PIPELINE_LOADED { success: false, error }` without zipData
- `PIPELINE_ZIP_DATA` receives ZIP `ArrayBuffer` directly from parent (Transferable), processes it and posts back `ZIP_LOADED` with `zipData: ArrayBuffer`
- Posts back: `DSL_NODE_UPDATED` (from `updateNodeMeta`), `NODE_DSL_LOADED`, `PIPELINE_LOADED`, `ZIP_LOADED`
- `window.runPlugin()` is separately exposed by `IframePanel` for Pixso plugin execution

Full message types in `src/types/window.d.ts` (`PostMessageEvent`, `PreviewPostMessageEvent`).

### DSL schema

`src/types/dsl.ts` — `DslNode` key fields: `nid`, `rect`, `layerType` (frame|component|text|image|icon), `passthrough`, `children`. Wireframe colors in `src/components/WireframeRenderer/colors.ts`.

## Verification

Before considering work done, run:

```bash
npm run build   # catches type errors and build failures
```
