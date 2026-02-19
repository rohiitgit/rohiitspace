const axios = require('axios');
const fs = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

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
        spotifyTokens.expires_at = process.env.SPOTIFY_TOKEN_EXPIRY ? Number.parseInt(process.env.SPOTIFY_TOKEN_EXPIRY) : null;
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
        console.log('No existing tokens found anywhere:', error.message);
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

// CORS configuration
const allowedOrigins = [
    'https://rohiit.space',
    'https://www.rohiit.space',
    'https://rohiitspace.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

function getCorsHeaders(origin) {
    const isAllowedOrigin = allowedOrigins.includes(origin) ||
                          origin?.includes('vercel.app');

    return {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    };
}

function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    return `${proto}://${host}`;
}

function getStateSecret() {
    return process.env.SPOTIFY_STATE_SECRET || process.env.SPOTIFY_CLIENT_SECRET || '';
}

function base64UrlEncode(value) {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function createOAuthState() {
    const payload = JSON.stringify({
        ts: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
    });
    const encodedPayload = base64UrlEncode(payload);
    const signature = crypto
        .createHmac('sha256', getStateSecret())
        .update(encodedPayload)
        .digest('base64url');

    return `${encodedPayload}.${signature}`;
}

function isValidOAuthState(state) {
    if (!state?.includes('.')) return false;
    const [encodedPayload, providedSignature] = state.split('.');
    if (!encodedPayload || !providedSignature) return false;

    const expectedSignature = crypto
        .createHmac('sha256', getStateSecret())
        .update(encodedPayload)
        .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);
    if (expectedBuffer.length !== providedBuffer.length) return false;
    if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return false;

    try {
        const parsed = JSON.parse(base64UrlDecode(encodedPayload));
        if (!parsed || typeof parsed.ts !== 'number') return false;
        // 10 minute expiry window for auth redirects
        return Date.now() - parsed.ts <= 10 * 60 * 1000;
    } catch {
        return false;
    }
}

// Main handler function
async function handler(req, res) {
    // Load tokens on each request (for serverless)
    await loadTokens();

    // Add CORS headers based on origin
    const origin = req.headers.origin;
    const corsHeaders = getCorsHeaders(origin);
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
    const pathname = normalizePathname(urlObj.pathname);
    const searchParams = urlObj.searchParams;

    try {
        // Route handling
        if (pathname === '/auth/spotify') {
            return await handleSpotifyAuth(req, res);
        }

        if (pathname === '/api/recent-tracks') {
            return await handleRecentTracks(req, res);
        }

        if (pathname === '/api/auth/status') {
            return await handleAuthStatus(req, res);
        }

        if (pathname === '/health') {
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
}

module.exports = handler;

// Handler functions
async function handleSpotifyAuth(req, res) {
    const scopes = 'user-read-recently-played';
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/server?callback=true`;
    const state = createOAuthState();

    const authUrl = `${SPOTIFY_AUTH_URL}?` +
        `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${encodeURIComponent(state)}&` +
        `show_dialog=false`;

    res.redirect(authUrl);
}

async function handleCallback(req, res, searchParams) {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const baseUrl = getBaseUrl(req);

    if (error) {
        return res.redirect(`${baseUrl}?error=${error}`);
    }

    if (!code) {
        return res.redirect(`${baseUrl}?error=no_code`);
    }

    if (!isValidOAuthState(state)) {
        return res.redirect(`${baseUrl}?error=invalid_state`);
    }

    try {
        const redirectUri = `${baseUrl}/api/server?callback=true`;
        const clientCredentials = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
        const basicAuth = Buffer.from(clientCredentials).toString('base64');

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
                    'Authorization': `Basic ${basicAuth}`
                }
            }
        );

        const tokenData = tokenResponse.data;

        if (tokenData.error) {
            return res.redirect(`${baseUrl}?error=${tokenData.error}`);
        }

        // Store tokens
        spotifyTokens = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
        };

        // Save tokens to file for persistence
        await saveTokens();

        res.redirect(`${baseUrl}?success=true`);

    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.redirect(`${baseUrl}?error=token_exchange_failed`);
    }
}

async function refreshAccessToken() {
    if (!spotifyTokens.refresh_token) {
        throw new Error('No refresh token available');
    }

    try {
        const clientCredentials = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
        const basicAuth = Buffer.from(clientCredentials).toString('base64');

        const response = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: spotifyTokens.refresh_token
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${basicAuth}`
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
        tokenExpiry: spotifyTokens.expires_at
    });
}

async function handleHealth(req, res) {
    res.json({
        status: 'ok',
        authenticated: !!spotifyTokens.access_token,
        tokenExpiry: spotifyTokens.expires_at ? new Date(spotifyTokens.expires_at).toISOString() : null
    });
}
