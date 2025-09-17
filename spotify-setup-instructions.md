# Spotify Setup Instructions

Since Spotify requires HTTPS redirect URIs, we'll use your deployed site for setup.

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

## Step 3: One-Time Authentication

1. Deploy your current changes to Vercel
2. Visit: `https://rohiitspace.vercel.app/auth/spotify`
3. Complete Spotify authentication
4. You'll be redirected back with success
5. Your Spotify integration will now persist!

## How It Works

- Your backend now saves tokens to persistent storage
- Refresh tokens are automatically used when access tokens expire
- Visitors never need to authenticate - they see your music immediately

## If You Need the Refresh Token

After authentication, you can check your server logs in Vercel dashboard to find the refresh token, then add it as `SPOTIFY_REFRESH_TOKEN` environment variable for extra persistence.