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

// Seed tokens from environment variables (primary) or file (secondary).
// Environment is authoritative for the *refresh* token, so a rotated
// SPOTIFY_REFRESH_TOKEN is picked up even on a warm container. But once the env
// refresh token is in memory, we keep the in-memory access token instead of
// resetting it from the (stale) env access token every request — otherwise each
// call would force a re-refresh, and /tmp isn't shared across invocations.
async function loadTokens() {
    const envRefresh = process.env.SPOTIFY_REFRESH_TOKEN;
    if (envRefresh) {
        if (spotifyTokens.refresh_token !== envRefresh) {
            // First load, or the env var was rotated out-of-band — adopt it and
            // take the matching env access token/expiry as the starting point.
            spotifyTokens.refresh_token = envRefresh;
            spotifyTokens.access_token = process.env.SPOTIFY_ACCESS_TOKEN || null;
            spotifyTokens.expires_at = process.env.SPOTIFY_TOKEN_EXPIRY ? Number.parseInt(process.env.SPOTIFY_TOKEN_EXPIRY) : null;
            console.log('Loaded tokens from environment variables');
        }
        return;
    }

    if (spotifyTokens.refresh_token) return;

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

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (allowedOrigins.includes(origin)) return true;
    // Allow Vercel preview deployments, but match the host as a proper suffix
    // so "https://evil-vercel.app.attacker.com" can't slip through a substring
    // check while credentials are enabled.
    try {
        const host = new URL(origin).hostname;
        return host === 'vercel.app' || host.endsWith('.vercel.app');
    } catch {
        return false;
    }
}

function getCorsHeaders(origin) {
    const allowed = isAllowedOrigin(origin);

    return {
        'Access-Control-Allow-Origin': allowed ? origin : allowedOrigins[0],
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

// Trusted hosts we're willing to build OAuth redirect URLs for. The Host
// header is attacker-controllable, so a request for an unknown host falls back
// to the canonical origin rather than reflecting it into a redirect.
const trustedRedirectHosts = new Set([
    'rohiit.space',
    'www.rohiit.space',
    'rohiitspace.vercel.app',
    'localhost:3000',
    '127.0.0.1:3000'
]);
const CANONICAL_ORIGIN = 'https://rohiit.space';

function getBaseUrl(req) {
    const host = req.headers.host;
    if (host && trustedRedirectHosts.has(host)) {
        const proto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
        return `${proto}://${host}`;
    }
    return CANONICAL_ORIGIN;
}

function getStateSecret() {
    const secret = process.env.SPOTIFY_STATE_SECRET || process.env.SPOTIFY_CLIENT_SECRET;
    if (!secret) {
        // Signing with an empty key makes the OAuth state forgeable, so fail
        // closed instead of accepting any attacker-supplied state.
        throw new Error('OAuth state secret is not configured');
    }
    return secret;
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

    try {
        const expectedSignature = crypto
            .createHmac('sha256', getStateSecret())
            .update(encodedPayload)
            .digest('base64url');

        const expectedBuffer = Buffer.from(expectedSignature);
        const providedBuffer = Buffer.from(providedSignature);
        if (expectedBuffer.length !== providedBuffer.length) return false;
        if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return false;

        const parsed = JSON.parse(base64UrlDecode(encodedPayload));
        if (!parsed || typeof parsed.ts !== 'number') return false;
        // 10 minute expiry window for auth redirects
        return Date.now() - parsed.ts <= 10 * 60 * 1000;
    } catch {
        // Missing secret or malformed payload — fail closed.
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

        if (pathname === '/api/github-contributions') {
            return await handleGitHubContributions(req, res);
        }


        // Handle callback
        if (searchParams.get('callback') === 'true') {
            return await handleCallback(req, res, searchParams);
        }

        res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        return res.redirect(`${baseUrl}?error=${encodeURIComponent(error)}`);
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
            return res.redirect(`${baseUrl}?error=${encodeURIComponent(tokenData.error)}`);
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

// Shared in-flight refresh so parallel requests that all find an expired token
// trigger exactly one refresh call instead of racing (which can invalidate each
// other's rotated refresh token).
let refreshInFlight = null;

function refreshAccessToken() {
    if (!refreshInFlight) {
        refreshInFlight = doRefreshAccessToken().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

async function doRefreshAccessToken() {
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

        // Re-auth when our own "no token" signal fires or Spotify rejects the
        // token with a 401; anything else is a generic failure. Don't echo the
        // raw error message back to the client.
        const needsAuth = error.response?.status === 401 ||
                          error.message?.includes('No valid token');
        if (needsAuth) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Need to authenticate with Spotify first',
                authUrl: '/auth/spotify'
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch tracks'
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

// GitHub contributions cache (1 hour TTL)
let githubCache = { data: null, expires_at: 0 };

async function handleGitHubContributions(req, res) {
    const token = process.env.GITHUB_PAT;
    if (!token) {
        return res.status(500).json({ error: 'GitHub PAT not configured' });
    }

    // Serve cached response if still valid
    if (githubCache.data && Date.now() < githubCache.expires_at) {
        return res.json(githubCache.data);
    }

    const query = `{
      user(login: "rohiitgit") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }`;

    try {
        const response = await axios.post(
            'https://api.github.com/graphql',
            { query },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // GraphQL returns 200 with an `errors` array on failure, and `user` is
        // null for an unknown login — guard the deep path so a bad response is a
        // clean 502 instead of a TypeError.
        if (response.data.errors?.length) {
            console.error('GitHub GraphQL errors:', response.data.errors);
            return res.status(502).json({ error: 'Failed to fetch GitHub contributions' });
        }
        const calendar = response.data?.data?.user?.contributionsCollection?.contributionCalendar;
        if (!calendar) {
            return res.status(502).json({ error: 'Failed to fetch GitHub contributions' });
        }
        githubCache = { data: calendar, expires_at: Date.now() + 60 * 60 * 1000 };
        res.json(calendar);
    } catch (error) {
        console.error('GitHub contributions error:', error.message);
        res.status(500).json({ error: 'Failed to fetch GitHub contributions' });
    }
}
