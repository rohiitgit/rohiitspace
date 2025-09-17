const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Path to store tokens in a temporary file
const TOKENS_FILE = path.join('/tmp', 'spotify-tokens.json');

// Default token structure
let spotifyTokens = {
    access_token: null,
    refresh_token: null,
    expires_at: null
};

// Load tokens from environment variables (primary) and file (secondary)
async function loadTokens() {
    // First, try to load from environment variables (most reliable for serverless)
    if (process.env.SPOTIFY_REFRESH_TOKEN) {
        spotifyTokens.refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
        spotifyTokens.access_token = process.env.SPOTIFY_ACCESS_TOKEN || null;
        spotifyTokens.expires_at = process.env.SPOTIFY_TOKEN_EXPIRY ? parseInt(process.env.SPOTIFY_TOKEN_EXPIRY) : null;
        console.log('Loaded tokens from environment variables');
        return;
    }

    // Fallback: try to load from file
    try {
        const data = await fs.readFile(TOKENS_FILE, 'utf8');
        const tokens = JSON.parse(data);

        // Validate token structure
        if (tokens.access_token || tokens.refresh_token) {
            spotifyTokens = { ...spotifyTokens, ...tokens };
            console.log('Loaded tokens from file');
        }
    } catch (error) {
        // No tokens available anywhere
        console.log('No existing tokens found anywhere');
    }
}

// Save tokens to file
async function saveTokens() {
    try {
        await fs.writeFile(TOKENS_FILE, JSON.stringify(spotifyTokens, null, 2));
        console.log('Tokens saved to file');
    } catch (error) {
        console.error('Failed to save tokens:', error);
    }
}

// Spotify OAuth endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Main handler function
module.exports = async (req, res) => {
    // Load tokens on each request (for serverless)
    await loadTokens();

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req;
    const urlObj = new URL(url, `https://${req.headers.host}`);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    try {
        // Route handling
        if (pathname.includes('/auth/spotify')) {
            return await handleSpotifyAuth(req, res);
        }

        if (pathname.includes('/api/recent-tracks')) {
            return await handleRecentTracks(req, res);
        }

        if (pathname.includes('/api/auth/status')) {
            return await handleAuthStatus(req, res);
        }

        if (pathname.includes('/health')) {
            return await handleHealth(req, res);
        }


        // Handle callback
        if (searchParams.get('callback') === 'true') {
            return await handleCallback(req, res, searchParams);
        }

        res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// Handler functions
async function handleSpotifyAuth(req, res) {
    const scopes = 'user-read-recently-played';
    const redirectUri = `https://${req.headers.host}/api/server?callback=true`;

    const authUrl = `${SPOTIFY_AUTH_URL}?` +
        `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `show_dialog=false`;

    res.redirect(authUrl);
}

async function handleCallback(req, res, searchParams) {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return res.redirect(`https://${req.headers.host}?error=${error}`);
    }

    if (!code) {
        return res.redirect(`https://${req.headers.host}?error=no_code`);
    }

    try {
        const redirectUri = `https://${req.headers.host}/api/server?callback=true`;

        // Exchange code for access token
        const tokenResponse = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                }
            }
        );

        const tokenData = tokenResponse.data;

        if (tokenData.error) {
            return res.redirect(`https://${req.headers.host}?error=${tokenData.error}`);
        }

        // Store tokens
        spotifyTokens = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
        };

        // Save tokens to file for persistence
        await saveTokens();

        res.redirect(`https://${req.headers.host}?success=true`);

    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.redirect(`https://${req.headers.host}?error=token_exchange_failed`);
    }
}

async function refreshAccessToken() {
    if (!spotifyTokens.refresh_token) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: spotifyTokens.refresh_token
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                }
            }
        );

        const data = response.data;

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        // Update tokens
        spotifyTokens.access_token = data.access_token;
        spotifyTokens.expires_at = Date.now() + (data.expires_in * 1000);

        // Update refresh token if provided
        if (data.refresh_token) {
            spotifyTokens.refresh_token = data.refresh_token;
        }

        // Save updated tokens to file
        await saveTokens();

        return spotifyTokens.access_token;

    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

async function getValidAccessToken() {
    // Check if token exists and is not expired
    if (spotifyTokens.access_token && Date.now() < spotifyTokens.expires_at - 60000) {
        return spotifyTokens.access_token;
    }

    // Token is expired or doesn't exist, try to refresh
    if (spotifyTokens.refresh_token) {
        return await refreshAccessToken();
    }

    throw new Error('No valid token available, need to re-authenticate');
}

async function handleRecentTracks(req, res) {
    try {
        const accessToken = await getValidAccessToken();

        const response = await axios.get(`${SPOTIFY_API_URL}/me/player/recently-played?limit=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = response.data;
        res.json(data);

    } catch (error) {
        console.error('Error fetching recent tracks:', error);

        if (error.message.includes('No valid token')) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Need to authenticate with Spotify first',
                authUrl: '/auth/spotify'
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch tracks',
                message: error.message
            });
        }
    }
}

async function handleAuthStatus(req, res) {
    res.json({
        authenticated: !!spotifyTokens.access_token,
        tokenExpiry: spotifyTokens.expires_at,
        hasRefreshToken: !!spotifyTokens.refresh_token,
        envRefreshToken: !!process.env.SPOTIFY_REFRESH_TOKEN,
        debug: {
            loadedFromEnv: !!process.env.SPOTIFY_REFRESH_TOKEN,
            tokenInMemory: !!spotifyTokens.refresh_token,
            hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
            hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET
        }
    });
}

async function handleHealth(req, res) {
    res.json({
        status: 'ok',
        authenticated: !!spotifyTokens.access_token,
        tokenExpiry: spotifyTokens.expires_at ? new Date(spotifyTokens.expires_at).toISOString() : null
    });
}

