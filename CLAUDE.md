# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run start` or `npm run dev` - Start static HTTP server on port 3000 (serves from root, entry at `/public`)
- `npm run build` - Build TailwindCSS with minification (production)
- `npm run build:css` - Build TailwindCSS without minification
- `npm run build:css:watch` - Watch mode for CSS builds
- `npm run vercel-dev` - Start Vercel development server (needed for API routes)

### Deployment
- Deploys automatically on Vercel
- Build command: `npm run build`
- Output directory: `public` (set in vercel.json)

## Architecture Overview

### Content-Data Separation
All website content is centralized in data files, with HTML templates using `data-content` attributes for dynamic population:

- **Portfolio content**: `/public/src/scripts/content.js` — `siteContent` object with all portfolio sections
- **Population logic**: `/public/src/scripts/main.js` — maps `siteContent` to DOM via `populateContent()`
- **FOUC prevention**: CSS opacity transitions hide content until population completes (elements get `populated` class)

### Pages
- `public/index.html` — Single-page portfolio (the only HTML page)

### TailwindCSS v4 Setup
- **Input**: `/styles.css` (root) — imports tailwindcss, defines custom variant for dark mode, theme colors (`--color-accent: #c2703a` warm brown)
- **Output**: `/public/src/styles/tailwind.css` (generated, do not edit directly)
- **Custom CSS**: `/public/src/styles/main.css` — notebook-style grid background, timeline animations, FOUC prevention
- Uses `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode

### API Layer
- `/api/server.js` — Vercel serverless function handling Spotify OAuth and `/api/recent-tracks`
- `/public/src/config/config.js` — API URL config with auto-detection (localhost vs production)
- Vercel rewrites route `/api/*`, `/auth/*`, and `/health` to the serverless function

### Key Libraries
- **Lenis** — Smooth scroll library, initialized in `main.js`
- **Vercel Analytics** — `@vercel/analytics` for page tracking

## Key Technical Patterns

### Content Updates
Edit the `siteContent` object in `/public/src/scripts/content.js` for all portfolio content. Sections: `meta`, `personal`, `navigation`, `hero`, `about`, `experience`, `projects`, `sideProjects`, `achievements`, `music`, `footer`, `social`.

### Theme System
- Dark/light toggle with ripple animation effect (full-screen circular expand)
- System preference detection with `localStorage` persistence
- Dark mode class applied to `<html>` element

### Pixel Character
`/public/src/scripts/pixel-character.js` — Animated canvas-based pixel art character in the hero section. Walks, jumps, and idles. Respects `prefers-reduced-motion`. Scale factor 2x mobile / 3x desktop.

### Timeline Animations
Experience section uses intersection observer with configurable midpoint (35% from viewport top) for progress lines and animated dots.

### Responsive Design
- Mobile-first TailwindCSS approach
- Notebook-style boundaries hidden below 1200px width
- Spotify section: mobile list view, desktop grid view

ALWAYS USE KARPATHY SKILLS.yes.