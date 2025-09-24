# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run start` or `npm run dev` - Start development server on port 3000
- `npm run build` - Build CSS using TailwindCSS CLI
- `npm run build:css` - Build CSS without minification
- `npm run build:css:watch` - Watch mode for CSS builds
- `npm run vercel-dev` - Start Vercel development server

### Deployment
- Project deploys automatically on Vercel
- Build command: `npm run build`
- Output directory: `.` (root directory)

## Architecture Overview

### Content Separation System
The project uses a sophisticated content-data separation architecture:

- **Content Data**: All website content is centralized in `/public/src/scripts/content.js` as a structured JavaScript object (`siteContent`)
- **Layout Templates**: HTML uses `data-content` attributes for dynamic population
- **Dynamic Population**: `/public/src/scripts/main.js` contains content population functions that map data to DOM elements
- **FOUC Prevention**: CSS opacity transitions prevent flash of unstyled content during population

Key functions in main.js:
- `populateContent()` - Main orchestrator for all content population
- Individual populate functions for each section (hero, about, experience, etc.)
- Content population happens on DOMContentLoaded or immediately if DOM is ready

### Styling Architecture
- **TailwindCSS**: Primary utility framework with custom configuration
- **Custom CSS**: `/public/src/styles/main.css` for specialized effects:
  - Notebook-style grid background with radial gradient dots
  - Timeline animations with progress bars and animated dots
  - FOUC prevention styles
  - Glow effects for interactive elements
  - Responsive margin boundaries (notebook lines)

### File Structure
```
/public/           # Served files (entry point)
├── index.html     # Main template with data-content attributes
├── src/           # Source code inside public for server compatibility
│   ├── scripts/
│   │   ├── main.js     # Application logic & content population
│   │   └── content.js  # Centralized content data
│   └── styles/
│       └── main.css    # Custom styles & animations
└── assets/        # Static assets (images, etc.)

/api/              # Serverless backend
└── server.js      # Spotify OAuth & API integration

/vercel.json       # Deployment configuration
```

### Spotify Integration
- Backend API in `/api/server.js` handles OAuth flow and token management
- Supports both environment variables and file-based token storage
- Frontend loads recently played tracks via `/api/recent-tracks`
- Responsive display: mobile list view, desktop grid view
- Automatic retry logic and authentication state management

## Key Technical Patterns

### Content Updates
To update website content, edit the `siteContent` object in `/public/src/scripts/content.js`. The system automatically populates all sections from this central data source.

### Theme System
- Dark/light mode toggle with ripple animation effect
- System preference detection with localStorage persistence
- Theme classes applied to `<html>` element

### Timeline Animations
Experience section uses intersection observer with custom timeline animations:
- Progress lines that fill based on scroll position
- Animated dots that appear and move along timeline
- Configurable midpoint intersection (35% from viewport top)

### Responsive Design Considerations
- Mobile-first TailwindCSS approach
- Notebook-style boundaries hidden below 1200px width
- Spotify section adapts layout: mobile list vs desktop grid
- Grid system uses CSS Grid with responsive columns

## Important Notes

### Server Configuration
- HTTP server must serve from `/public` directory
- All file paths in HTML reference `/src/` inside public folder
- Vercel configuration handles API routing and caching headers

### Performance Optimizations
- Content opacity transitions prevent FOUC
- Hardware-accelerated CSS transitions
- Lazy loading for images
- Efficient intersection observers for animations