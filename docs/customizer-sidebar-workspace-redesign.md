# BrainShake: reference for customizer, sidebar, and workspace

## Objective

Reduce visual noise in the customizer and navigation, making the main actions easy to find. The visual direction is a lightweight desktop interface inspired by the finish of macOS: typography, spacing, and component density should feel crisp, calm, and intentional without becoming overly “skeuomorphic.”

The screenshots provided are visual references. The first documents the current customizer; the second guides the treatment of controls (clear grouping, spacing, state colors, and contained buttons).

## Reading the current state

### Customizer

- The `Customize` tab groups grid, dock position, auto-hide, theme, ten accent colors, four interface color overrides, drawing, and accessibility in one long column.
- `Theme` and accent swatches are the most frequent global personalization. `Header`, `Sidebar`, `Canvas`, and `Panels` are finer adjustments and can live in a collapsed advanced area.
- Hex values, `Reset` buttons, and color pickers create rows with different visual weights. The four resets increase the page height.
- The help text for autocorrect is long for a simple adjustment; accessibility options also include descriptions that take up a lot of space.
- In the narrow screenshot, the tab header occupies a full band; the content has small labels, loose alignment, and repeated separators.

### Workspace sidebar

- The same column contains canvas actions, file import, URL import, export, boards, snapshots, and footer links.
- Import and export also appear in the topbar. This duplication increases the number of choices without helping users discover actions.
- Boards and snapshots are recurring content; URL import, JSON export, and external links are less frequent.
- The snapshot asks for a name and exposes lineage metadata on each item, although most visits probably only need to save or restore.

### Workspace and chrome

- The topbar combines identity, board name, save state, export, import, tour, presentation, and settings.
- The dock brings together tools, shapes, stroke configuration, presentation, import, and history, plus a handle to move it.
- Object properties already appear in a floating panel. The second image can serve as the visual language for this kind of contextual panel: grouped controls, few labels, consistent alignment, and compact rows.
- `DM Sans` and `Space Grotesk` give a geometric personality. For a more Apple-like direction, the starting point is a native system font stack; reserve a display font for the brand only if needed.
- The workspace feels like a dense desktop app; the visual system should prioritize scanning, rhythm, and grouping instead of raising every control to the same prominence.

## Proposed structure

### Sidebar: two simple areas

**Workspace**

1. Small header with board title and action menu (`Import`, `Export`, `Rename`, or equivalent actions).
2. Board list with `+` aligned to the section title.
3. Snapshots as a collapsible section; show name and short time. `Save snapshot` opens a compact field on demand.
4. Footer reduced to `Help` and `About`/`Source`; remove the fixed promotional paragraph from the column.

**Customize**

1. **Appearance**: theme selector, four system accent colors, a rainbow disc without a center to open the custom color picker, and `More` to reveal the other options. The swatches have a compact form and row-based grouping.
2. **Drawing**: shape autocorrect with a label and a short description.
3. **Accessibility**: compact controls for text size, high contrast, and reduced motion. Less frequent options go under `More accessibility options`.
4. **Advanced appearance** collapsed: dock position, auto-hide, and custom colors for header, sidebar, canvas, and panels, in a compact list with selector and reset per row.

Do not remove existing settings before measuring usage. First hide them under `Advanced`, preserve their values, and ensure keyboard access.

### Navigation and workspace

- Keep `Workspace` and `Customize` as two clear tabs with a stable selected indicator. Avoid turning each category into another level of navigation.
- Keep `Import` in a primary place. One option is the board actions menu in the topbar; the sidebar can keep only boards and snapshots.
- Keep export in the topbar and place `Import board`, presentation, object properties panel, and tour under `More`. The sidebar offers a single `Add to canvas` button for files and URLs without repeating the same actions elsewhere.
- Preserve in the dock the tools used during creation: select, hand, text, sticky note, pen, and connector. Group shapes in a single button and keep undo/redo visible.
- Move presentation and import to secondary actions, or show presentation only when there are selectable items. Keep functionality available while reducing its visual weight in the default state.
- Open the properties panel when an object is selected and show only the groups relevant to that object type. Follow reference 2 for colors, thickness, opacity, layers, and contextual actions.
- Use a consistent edge-to-edge rhythm so controls feel like they belong to the same system rather than a collection of scattered menu entries.

## Visual direction

| Element | Recommended reference |
| --- | --- |
| Font | Lexend as interface font, with `-apple-system`, `BlinkMacSystemFont`, and `Segoe UI` as fallbacks; titles at weight 600, without a separate display font for each panel |
| Interface text | 14 px base; section labels 12–13 px; helper text 11–12 px; avoid functional text below 12 px |
| Sidebar | 272–288 px on desktop; horizontal padding 16 px; navigation item height 36–40 px |
| Spacing | 4 / 8 / 12 / 16 / 24 px scale; 16–20 px between groups; use dividers only between main areas |
| Surfaces | white or very light gray, neutral 1 px border, radius 10–12 px; low shadow only for floating panels |
| Selection | soft highlight background with accessible focus outline; do not rely on color alone |
| Controls | 32 px height for standard options; touch targets at least 40 px; swatches 24–28 px |
| Icons | Lucide 16–18 px, aligned and clickable with consistent hit areas |

Initial palette: overall background `#F5F5F7`, surface `#FFFFFF`, primary text `#1D1D1F`, secondary text `#6E6E73`, line `#D2D2D7`, soft selection `#E8E8ED`, and blue `#0A84FF` as the initial accent.

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ BrainShake       Board name                                Saved   ⋯ │
├──────────────────────────────┬───────────────────────────────────────┤
│ Workspace     Customize      │                                       │
│                              │                                       │
│ Boards                  +     │                canvas                 │
│  ● Ideas                     │                                       │
│    References               │                                       │
│                              │                                       │
│ Snapshots               ⌄    │                                       │
│  Today · 14:20              │                                       │
│  Yesterday · 17:05          │             [ tools dock ]            │
│                              │                                       │
│ Help                        │                                       │
└──────────────────────────────┴───────────────────────────────────────┘

Customize:
┌───────────────────────────┐
│ Appearance               │
│ Theme              Light⌄ │
│ Accent       ● ● ● ● ● +  │
│                           │
│ Canvas                    │
│ Show grid              ●  │
│                           │
│ Accessibility             │
│ Text size       A−  A  A+ │
│ High contrast          ○  │
│ Reduce motion          ○  │
│                           │
│ Advanced appearance    › │
└───────────────────────────┘
```

## Mapping to code

- The navigation composition is in `src/layout/Sidebar.tsx`; the current state toggles `workspace` and `customize`.
- The customizer content is in `src/layout/SidebarSettings.tsx` and `src/features/properties/AppearanceSettings.tsx`.
- Global color overrides and theme variables are in `src/features/preferences/usePreferences.ts` and `src/app/App.tsx`; maintain compatibility with local storage.
- Boards and snapshots are in `src/features/board/components/BoardList.tsx` and `src/features/workspace/SnapshotList.tsx`.
- The header and global actions are in `src/layout/Topbar.tsx`; the tool dock is in `src/features/toolbar/Toolbar.tsx`.
- Most of the visual styling is concentrated in `src/styles/globals.css`, with canvas styles in `src/styles/canvas.css`. Since there are responsive rules and overrides at the end of the CSS, a change here should be reviewed carefully before editing.

## Safe reconstruction sequence

1. I adjusted the global typography to Lexend, with system fallbacks, and increased the base interface size to 14 px.
2. I regrouped the customizer and moved rare options into advanced areas, preserving preferences and saved values.
3. I simplified the workspace sidebar, collapsed snapshots, and grouped secondary actions in the topbar menu.
4. I reduced the dock to the most frequently used tools and history; contextual actions appear when there is a selection.
5. I reviewed the screens in the browser and aligned the sidebar, customizer, dock, action menu, contextual panel, and touch target sizes to the same scale of surfaces, borders, and controls. The custom color selector and advanced grouping were refined to support scanning and reduce noise.

## Limits of the inspection

The SVG is a conceptual reference for hierarchy and visual treatment; it does not represent every action or interface state with pixel-perfect fidelity. The review was done in the local app with realistic data, so the final implementation should still be validated against actual usage patterns and edge cases.

If you want, I can also transform this into:
- a more polished product-spec version,
- a concise PR description,
- or a task breakdown with implementation steps.
