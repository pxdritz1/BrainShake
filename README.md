<div align="center">

<a href="https://pxdritz1.github.io/BrainShake/"><img src="public/brainshake-stamp.svg" alt="BrainShake logo" width="180"></a>

# [BrainShake](https://pxdritz1.github.io/BrainShake/)

### A local-first, libre, and free canvas website.

Create notes, connect thoughts, draw freely, and bring assets into one focused workspace. No account, no backend, no cloud lock-in.

[![Deploy](https://github.com/pxdritz1/BrainShake/actions/workflows/deploy.yml/badge.svg)](https://github.com/pxdritz1/BrainShake/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/github/license/pxdritz1/BrainShake)](LICENSE)

<div align="center">

[![Ko-fi support](https://cdn.modrinth.com/data/cached_images/c4c994ca06f3bc6bbcfdc5f6b98d4af42e397033.png)](https://ko-fi.com/pxdritz1)

## See it in action

BrainShake includes multiples visual themes. The board stays dense and practical while the canvas remains yours to shape.

| Light | Dark |
| --- | --- |
| ![BrainShake light theme](screenshots/white.png) | ![BrainShake dark theme](screenshots/dark.png) |

| Warm | Mint | OLED |
| --- | --- | --- |
| ![BrainShake warm theme](screenshots/warm.png) | ![BrainShake mint theme](screenshots/mint.png) | ![BrainShake OLED theme](screenshots/OLED.png) |

## Highlights

- Infinite-feeling canvas with scroll zoom, middle-button drag pan, grid controls, multi-selection, movement, and resizing
- Sticky notes, text widgets, images, videos, sandboxed HTML previews, and connectors
- Draggable widget titlebars with accent colors and one-click close controls
- Light, warm, mint, dark, and OLED themes with persistent accent customization
- Pen tool for mouse, touch, and stylus input, with strokes preserved after reload
- Import local assets by file picker or drag and drop
- Import web images directly from a URL
- Duplicate, delete, copy, paste, bring to front, and undo or redo changes
- Keyboard shortcuts, context menu, properties panel, and responsive layout
- Autosave to browser storage, named workspace snapshots, and `.brainshake` export and import
- Static deployment configured for GitHub Pages

Imported assets are stored as Data URLs so images, videos, and HTML previews remain available after reopening the page. A `.brainshake` file includes every board, named snapshots, and local assets; the separate `.json` export contains only the current board and omits media. Large files can exceed the browser's `localStorage` quota; when that happens, the header reports a save failure and exporting a `.brainshake` backup is recommended. See [the workspace format](docs/brainshake-format.md) for the archive layout and compatibility details.

## Run locally

BrainShake requires Node.js `22.12.0` or newer. Vitest 5 does not support older Node.js versions.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. To create a production build:

```bash
npm run build
npm run preview
```

The build checks TypeScript before Vite bundles the app. Run `npm run typecheck`,
`npm run lint`, and `npm run format:check` separately when working on the code.

## Project status

BrainShake is an actively evolving browser canvas. The project is intentionally small, local-first, and easy to run, inspect, and deploy.

See [the website guide](docs/website-accessibility.md) for accessibility,
interface customization, and presentation mode details.
