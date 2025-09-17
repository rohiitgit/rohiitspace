// Backend API configuration
const API_CONFIG = {
    // Development
    BACKEND_URL: 'http://localhost:3001',

    // Production (update when deploying)
    // BACKEND_URL: 'https://your-backend-domain.vercel.app',

    ENDPOINTS: {
        RECENT_TRACKS: '/api/recent-tracks',
        AUTH_STATUS: '/api/auth/status',
        SPOTIFY_AUTH: '/auth/spotify'
    }
};

// Auto-detect environment
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production - update this URL when you deploy your backend
    API_CONFIG.BACKEND_URL = 'https://your-backend-domain.vercel.app';
}

// Export for use in other files
window.API_CONFIG = API_CONFIG;