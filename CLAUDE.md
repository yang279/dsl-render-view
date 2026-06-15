# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm run build     # type-check + production build (outputs to dist/)
npm run preview   # serve the built dist/ at http://localhost:4173
```

**Playwright E2E tests** run against the preview server (`http://localhost:4173`), so build first:

```bash
npm run build && npx playwright test          # run all tests
npx playwright test tests/build-product.spec.ts  # run a single file
```

## Architecture

This is a **Vue 3 + JSX + TypeScript** single-page app built with Vite. All components use `defineComponent` with the Composition API and return a render function (JSX), not an Options API template. The `@` alias resolves to `src/`.

### Two routes / two modes

The router (`src/router/index.ts`) uses hash history with two child routes under `WorkspaceLayout`:

| Route | Page | Purpose |
|---|---|---|
| `#/editor` | `EditorPage` | Render DSL wireframes, click nodes to edit metadata |
| `#/preview` | `PreviewPage` | iframe wrapper for loading URLs or ZIP packages |

### Data flow

**DSL (editor side)**
- `useDslStore` (Pinia) holds `nodes: DslNode[]` — the raw nested node tree.
- `WireframeRenderer` flattens the tree, culls nodes outside the viewport, and scales X coordinates to fill the container width while preserving Y coordinates as absolute pixels.
- Clicking a `NodeBlock` opens `NodeInfoPopover` (Element Plus popover) to edit `layerType`, `layerName`, `layerDescription` in-place via `updateNodeMeta`.

**Preview (iframe side)**
- `usePreviewStore` (Pinia) holds the iframe `src`, `hexData` (extracted from `.txt` files in the ZIP), and `svgMap` (keyed by bare SVG filename without extension).
- `IframePanel` loads a URL in an iframe. When a ZIP is uploaded, it extracts resources to blob URLs, passes `hexData`/`svgMap` to the store, and auto-invokes `window.runPlugin()` once `_FicAppObj` is detected on the iframe's `contentWindow` (Pixso editor integration).
- The iframe console is intercepted via injected script relaying `postMessage` events to the panel's Console log.

### Window bridge (`useWindowBridge`)

Initialized once in `App.tsx`, this composable attaches three functions to `window` so a host WebView can call them:
- `window.uploadDsl()` — file picker → JSON parse → `dslStore.setNodes()`
- `window.downloadDsl()` — serialize `dslStore.nodes` → download JSON
- `window.uploadZip()` — file picker → JSZip extraction → `previewStore.setResources/setHexData/setSvgMap`

`window.runPlugin()` is separately exposed by `IframePanel` and executes a Pixso plugin script built from `hexData` + `svgMap`.

### DSL node schema

Defined in `src/types/dsl.ts`. Key fields on `DslNode`:
- `nid` — unique numeric ID (used as Vue `:key` and for `findNode` recursion)
- `rect: { x, y, w, h }` — absolute coordinates in the original design canvas
- `layerType` — one of `frame | component | text | image | icon`; drives colors in `WireframeRenderer/colors.ts`
- `passthrough: true` — node is skipped by the renderer (zero-size nodes are also skipped)
- `children` — nested child nodes

### Styling

Tailwind CSS 4 (via `@tailwindcss/vite` plugin). Element Plus is used only in `NodeInfoPopover` for its form components and popover. Wireframe block colors are hardcoded in `src/components/WireframeRenderer/colors.ts`.
