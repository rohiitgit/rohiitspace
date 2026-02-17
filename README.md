# rohiitspace - Personal Portfolio Website

A modern, responsive portfolio website built with HTML, TailwindCSS, and vanilla JavaScript.

## 🏗️ Project Structure

```
rohiitspace/
├── public/                 # Public assets and entry point
│   ├── index.html          # Main HTML file
│   └── assets/             # Static assets
│       └── images/         # Images (profile pictures, backgrounds)
├── public/src/             # Frontend source files
│   ├── styles/             # CSS files
│   │   ├── main.css        # Custom styles
│   │   └── tailwind.css    # TailwindCSS compiled output
│   ├── scripts/            # JavaScript files
│   │   ├── main.js         # Main application logic
│   │   └── content.js      # Website content data
│   └── config/             # Configuration files
│       └── config.js       # Site configuration
├── api/                    # Backend API
│   └── server.js           # Spotify integration server
├── docs/                   # Documentation
│   └── spotify-setup-instructions.md
├── package.json            # Node.js dependencies
├── vercel.json            # Deployment configuration
└── README.md              # Project documentation
```

## 🚀 Features

- **Responsive Design**: Mobile-first approach with clean grid layout
- **Dark/Light Mode**: Theme toggle with smooth ripple animation
- **Dynamic Content**: Separated content from layout for easy updates
- **Spotify Integration**: Shows recently played tracks
- **Timeline Animations**: Smooth scrolling experience effects
- **Performance Optimized**: Fast loading with FOUC prevention

## 🛠️ Tech Stack

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js (Spotify API integration)
- **Deployment**: Vercel
- **Build Tools**: TailwindCSS CLI

## 📁 File Organization

### `/public/`
Contains the main HTML file and static assets that are served directly.

### `/public/src/`
Source code organized by type:
- **`/styles/`**: All CSS files (custom styles and TailwindCSS output)
- **`/scripts/`**: JavaScript files including main logic and content data
- **`/config/`**: Configuration files

### `/api/`
Backend API endpoints for Spotify integration.

### `/docs/`
Project documentation and setup instructions.

## 🔧 Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 📝 Content Management

Website content is managed through `/public/src/scripts/content.js`. This file contains:
- Personal information
- Project details
- Work experience
- Skills and technologies
- Social links
- Meta tags and SEO data

To update content, simply edit the `siteContent` object in this file.

## 🎨 Styling

The project uses a combination of:
- **TailwindCSS**: Utility-first framework for rapid styling
- **Custom CSS**: Custom animations, theme effects, and unique designs

Custom styles are located in `/public/src/styles/main.css`.

## 📱 Responsive Design

The website is built with a mobile-first approach and features:
- 12-column grid system
- Responsive navigation
- Optimized images and assets
- Touch-friendly interactions

## 🌙 Theme System

Features a custom dark/light mode toggle with:
- Smooth ripple transition animation
- System preference detection
- Local storage persistence
- Consistent theming across all components

## 📊 Performance

- **Fast Loading**: Optimized asset delivery
- **FOUC Prevention**: Content loads smoothly without flash
- **Efficient Animations**: Hardware-accelerated transitions
- **Lazy Loading**: Images load as needed

## 🚀 Deployment

The site is configured for deployment on Vercel with automatic builds and optimizations.

## 📄 License

© 2025 rohit. All rights reserved.
