const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Store tokens in memory (in production, use a database)
let spotifyTokens = {
    access_token: null,
    refresh_token: null,
    expires_at: null
};

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Spotify OAuth endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Step 1: Redirect to Spotify for authorization
app.get('/auth/spotify', (req, res) => {
    const scopes = 'user-read-recently-played';
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/spotify/callback`;

    const authUrl = `${SPOTIFY_AUTH_URL}?` +
        `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `show_dialog=false`;

    res.redirect(authUrl);
});

// Step 2: Handle Spotify callback and exchange code for tokens
app.get('/auth/spotify/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    try {
        const redirectUri = `${req.protocol}://${req.get('host')}/auth/spotify/callback`;

        // Exchange code for access token
        const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=${tokenData.error}`);
        }

        // Store tokens
        spotifyTokens = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
        };

        console.log('✅ Spotify authentication successful!');
        res.redirect(`${process.env.FRONTEND_URL}?success=true`);

    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.redirect(`${process.env.FRONTEND_URL}?error=token_exchange_failed`);
    }
});

// Step 3: Refresh access token when needed
async function refreshAccessToken() {
    if (!spotifyTokens.refresh_token) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: spotifyTokens.refresh_token
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        // Update tokens
        spotifyTokens.access_token = data.access_token;
        spotifyTokens.expires_at = Date.now() + (data.expires_in * 1000);

        // Update refresh token if provided (Spotify sometimes provides a new one)
        if (data.refresh_token) {
            spotifyTokens.refresh_token = data.refresh_token;
            console.log('✅ New refresh token received and stored');
        }

        console.log('✅ Token refreshed successfully');
        return spotifyTokens.access_token;

    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

// Step 4: Get valid access token (refresh if needed)
async function getValidAccessToken() {
    // Check if token exists and is not expired
    if (spotifyTokens.access_token && Date.now() < spotifyTokens.expires_at - 60000) { // 1 minute buffer
        return spotifyTokens.access_token;
    }

    // Token is expired or doesn't exist, try to refresh
    if (spotifyTokens.refresh_token) {
        return await refreshAccessToken();
    }

    throw new Error('No valid token available, need to re-authenticate');
}

// API endpoint to get recent tracks
app.get('/api/recent-tracks', async (req, res) => {
    try {
        const accessToken = await getValidAccessToken();

        const response = await fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=5`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
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
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        authenticated: !!spotifyTokens.access_token,
        tokenExpiry: spotifyTokens.expires_at ? new Date(spotifyTokens.expires_at).toISOString() : null
    });
});

// Status endpoint to check authentication
app.get('/api/auth/status', (req, res) => {
    res.json({
        authenticated: !!spotifyTokens.access_token,
        tokenExpiry: spotifyTokens.expires_at,
        hasRefreshToken: !!spotifyTokens.refresh_token
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🎵 Spotify Client ID: ${process.env.SPOTIFY_CLIENT_ID}`);
    console.log(`🔐 To authenticate, visit: http://localhost:${PORT}/auth/spotify`);
});