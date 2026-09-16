# 馬尼拉三日 — Design System

Master tokens for `apps/manila-2026-09` only. Generated with ui-ux-pro-max `--design-system`, then overridden by brand anchors (Dora sky / gold). Do not copy Bangkok zen-paper.

## Product

Mobile travel companion for a 3-day Manila trip. Glassmorphism + rounded toy-like Dora language. Max width `28rem` phone shell.

## Color (CSS / Tailwind aliases)

Existing class names `zen-*` are remapped so frozen pages (行程 / 記帳) pick up the theme without JSX restructure.

| Token | Hex | Role |
| --- | --- | --- |
| `--color-background` / `zen-bg` | `#d7f0ff` | Sky canvas |
| `--color-primary` / `zen-moss` | `#3aa0e8` | Dora blue (was moss green) |
| `--color-accent` / `zen-brown` | `#d4a017` | Gold with text contrast |
| `--color-gold` | `#f5c518` | Nav ring / highlight |
| `--color-foreground` / `zen-text` | `#1a3a52` | Navy body (≥ 4.5:1 on sky) |
| `--color-muted` / `zen-text-light` | `#5a7a92` | Secondary text |
| `--color-card` | `#ffffff` | Glass card fill |
| `--color-destructive` | `#dc2626` | SOS / delete |

Skill suggestion (navy `#1E3A8A` + booking orange) is **not** used; Dora blue/gold is the product identity.

## Typography

- Display / UI: Plus Jakarta Sans
- Body CJK: Noto Sans TC
- Zen Maru Gothic is no longer the primary body stack (too Japanese)

Scale: 12 / 14 / 16 / 18 / 24 / 32. Body ≥ 16px where possible. Tabular numbers for money and countdown.

## Radius & elevation

- Capsule nav: `9999px`
- Cards: `2rem` (`organic` / `pebble`)
- Gold ring on nav: `3px #f5c518`
- Shadow: soft sky (`0 12px 32px rgba(58,160,232,0.22)`), not moss green

## Motion

- Micro: 150–300ms, ease-out enter, faster exit
- Animate `transform` / `opacity` only
- Route: View Transitions API, types `forward` / `backward` from bottom-nav index
- Sheets: `@starting-style` + `allow-discrete` on `dialog`
- Brand loop: one cloud drift; disable under `prefers-reduced-motion`
- Stagger lists 40ms; max 1–2 focus motions per screen

## Components (shadcn-shaped, CDN Tailwind)

`Sheet`, `Accordion`, `Toast`, `Skeleton` live in `components/ui`. Patterns follow `@shadcn` sheet-demo / accordion-demo without migrating off Tailwind CDN.
