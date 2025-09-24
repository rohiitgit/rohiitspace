# Spotify Setup Instructions - PERMANENT FIX

To prevent the "authenticate spotify" button from appearing, follow these steps:

## Step 1: Configure Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Open your app or create a new one
3. Click "Edit Settings"
4. Add this to **Redirect URIs**:
   ```
   https://rohiitspace.vercel.app/api/server?callback=true
   ```
5. Save settings

## Step 2: Set Environment Variables

In your Vercel dashboard (Settings → Environment Variables), add:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Step 3: Get Your Refresh Token (ONE TIME ONLY)

1. Deploy your current changes to Vercel
2. Visit: `https://rohiitspace.vercel.app/auth/spotify`
3. Complete Spotify authentication
4. Check Vercel function logs to find the refresh token
5. Add to Vercel environment variables:
   ```
   SPOTIFY_REFRESH_TOKEN=the_long_refresh_token_from_logs
   ```

## Step 4: Final Deployment

1. Redeploy your site after adding the refresh token
2. Test by visiting your site
3. Spotify tracks should appear immediately for all visitors

## Why This Fixes the Problem

**Environment variables are permanent** - unlike temporary files that get cleared, environment variables persist across all deployments and cold starts. Once you set `SPOTIFY_REFRESH_TOKEN`, your site will:

- ✅ Always have access to Spotify data
- ✅ Never show authentication prompts to visitors
- ✅ Work immediately on every page load
- ✅ Automatically refresh tokens in the background

The authentication button will never appear again once the refresh token is properly set in environment variables.