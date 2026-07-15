# Blast Radius — Design

## 1. Aesthetic direction

**Blueprint/technical.** Blast Radius reads like an engineering schematic: a deep blueprint-navy
canvas, faint cyan grid lines like graph paper, monospace command text stamped in like a
technical annotation, and a stark red "blast radius" accent that only appears when something is
actually dangerous. The tool is doing precise, structural analysis — parsing syntax, not
guessing — and the page should look like it takes that as seriously as the code does.

This direction and palette (cool navy + cyan + red accent) is distinct from a generic
dark-mode-with-one-accent treatment: the grid, the stamp-in motion, and the schematic corner
marks are load-bearing, not decoration bolted onto a dark theme.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a1128` | page background (deep blueprint navy) |
| `--surface-1` | `#101b3d` | cards, panels |
| `--surface-2` | `#16234d` | raised elements, input fields |
| `--text` | `#e8edf9` | primary text |
| `--text-muted` | `#8996b8` | secondary text, labels |
| `--accent` | `#35c9c1` | primary accent — cyan/teal "schematic ink" |
| `--accent-support` | `#ffb454` | secondary accent — amber, used for `caution` |
| `--danger` | `#ff5c5c` | blast-red — `danger` severity only |
| `--success` | `#4ade80` | `safe` severity |
| `--grid-line` | `rgba(53, 201, 193, 0.08)` | background graph-paper grid |

**Type pairing:** display font **Space Grotesk** (geometric, technical) for the wordmark and
headings; UI font **IBM Plex Mono** for body copy, command input, and findings — the monospace
UI font is deliberate, reinforcing that this is a tool about reading command syntax precisely.
Both from Google Fonts, with `system-ui` / `ui-monospace` fallbacks.

**Spacing:** 8px base unit (8/16/24/32/48/64).

**Corner radius:** 4px — sharp and precise, not soft/rounded (rounded corners read as "friendly
consumer app," which fights the schematic direction).

**Shadow/glow:** no drop shadows; depth comes from a subtle cyan glow (`box-shadow: 0 0 0 1px
var(--accent) at low opacity, plus a soft blur`) on focused/active elements, and from the grid
pattern giving surfaces texture instead of flat color.

**Motion:** UI transitions 150ms ease-out. A finding's severity badge "stamps" in with a quick
100ms scale-punch (1.15 → 1.0) rather than a fade — reinforces the technical-annotation feel.

## 3. Layout intent

The hero is the **paste box + findings breakdown**, composed side by side on desktop (paste box
~45%, findings ~55%) and stacked on mobile (paste box first, findings below, both full-width).
Together they take ~65% of the viewport height on a 1440×900 desktop. Below the fold: the two
contrast examples (red `curl | sudo bash` next to green harmless command) that ARE the wow
moment — pre-filled and visible with no interaction required, so the page proves its point on
load, not after a user figures out what to paste.

At 390×844 (phone): header, paste box, Analyze button, findings, then the two contrast examples
stacked full-width — no horizontal scroll, no dead margins either side (content spans to 16px
page padding).

## 4. Signature detail

When analysis produces a `danger` finding, a thin dashed circle — the literal "blast radius" —
pulses outward once from the severity badge (`@keyframes` scale + fade, ~600ms, respecting
`prefers-reduced-motion`). It's the one flourish, tied directly to the product name, and it only
fires on real danger so it stays meaningful rather than decorative noise.

## 5. Juice plan

Not applicable — Blast Radius is a dev tool, not a game or playful toy. The equivalent
"feedback" requirement is covered by interaction states (D2) and the signature blast-radius
pulse above: input → analysis renders in under 200ms, every control has themed hover/focus/
active states, and the one danger-only animation stands in for a "juice" moment.
