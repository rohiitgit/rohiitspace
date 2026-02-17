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
- **Blog content**: `/public/src/scripts/blogs.js` — `blogContent` object with blog posts (content is inline HTML in template literals)
- **Population logic**: `/public/src/scripts/main.js` — maps `siteContent` to DOM via `populateContent()`
- **Blog logic**: `/public/src/scripts/blog-main.js` — handles both listing page (`blogs.html`) and individual post page (`blog.html?slug=<id>`)
- **FOUC prevention**: CSS opacity transitions hide content until population completes (elements get `populated` class)

### Pages
- `public/index.html` — Portfolio/homepage
- `public/blogs.html` — Blog listing page (tag filtering via URL params)
- `public/blog.html` — Individual blog post (loaded via `?slug=<blog-id>` query param)

### TailwindCSS v4 Setup
- **Input**: `/styles.css` (root) — imports tailwindcss, defines custom variant for dark mode, theme colors (`--color-accent: #6366f1`)
- **Output**: `/public/src/styles/tailwind.css` (generated, do not edit directly)
- **Custom CSS**: `/public/src/styles/main.css` — notebook-style grid background, timeline animations, FOUC prevention, glow effects
- Uses `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode

### API Layer
- `/api/server.js` — Vercel serverless function handling Spotify OAuth and `/api/recent-tracks`
- `/public/src/config/config.js` — API URL config with auto-detection (localhost vs production)
- Vercel rewrites route `/api/*`, `/auth/*`, and `/health` to the serverless function

### Key Libraries
- **Lenis** — Smooth scroll library, initialized in both `main.js` and `blog-main.js`
- **Vercel Analytics** — `@vercel/analytics` for page tracking

## Key Technical Patterns

### Content Updates
Edit the `siteContent` object in `/public/src/scripts/content.js` for portfolio content. Edit `blogContent.blogs` array in `/public/src/scripts/blogs.js` to add/modify blog posts. Each blog has an `id` (used as URL slug), inline HTML `content`, and metadata (date, tags, readTime).

### Theme System
- Dark/light toggle with ripple animation effect (full-screen circular expand)
- System preference detection with `localStorage` persistence
- Dark mode class applied to `<html>` element
- Blog pages duplicate theme/menu init logic in `blog-main.js` (not shared from `main.js`)

### Blog System
- Blog posts are stored as objects in `blogs.js` with inline HTML content
- Listing page supports tag filtering with URL param persistence (`?tag=<tagname>`)
- Individual post page features: reading progress bar, share buttons, prev/next navigation, related posts (by shared tags), copy-code buttons on `<pre><code>` blocks

### Timeline Animations
Experience section uses intersection observer with configurable midpoint (35% from viewport top) for progress lines and animated dots.

### Responsive Design
- Mobile-first TailwindCSS approach
- Notebook-style boundaries hidden below 1200px width
- Spotify section: mobile list view, desktop grid view
