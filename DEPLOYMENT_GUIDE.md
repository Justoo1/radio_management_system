# Deployment Guide - Radio Management System

## Architecture Overview

The application is deployed across two platforms:

```
┌─────────────────────────────────────────────────────┐
│              The Frontend Users                    │
└────────────────┬────────────────┬───────────────────┘
                 │                │
                 ▼                ▼
         ┌──────────────┐  ┌──────────────────┐
         │   Vercel     │  │   Render         │
         │  (Next.js)   │  │  (Socket.IO)     │
         │              │  │                  │
         │ - Frontend   │  │ - WebSocket      │
         │ - REST API   │  │ - Real-time      │
         │ - Database   │  │ - Redis pub/sub  │
         └──────────────┘  └──────────────────┘
                 │                │
                 └────────┬────────┘
                          ▼
                 ┌──────────────────┐
                 │   Upstash Redis  │
                 │   (Cloud Cache)  │
                 └──────────────────┘
```

## Deployment Checklist

### 1. Upstash Redis Setup (Already Done ✅)

The Redis is configured to:
- Work with both local and cloud Redis
- Automatically detect Upstash and apply optimized settings
- Handle connection retries gracefully

**Environment Variable:**
```
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:YOUR_PORT
```

### 2. Render Socket.IO Server Setup

#### Step 2.1: Create Web Service on Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `radio-socket-server` |
   | **Region** | Choose nearest to users |
   | **Branch** | `master` (or your main branch) |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `NODE_ENV=production tsx server.ts` |
   | **Plan** | Free (or Pro for always-on) |

#### Step 2.2: Add Environment Variables to Render

In Render Dashboard → Settings → Environment:

```
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
DATABASE_URL=your_database_url_here
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:YOUR_PORT
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

**Where to get these values:**
- `DATABASE_URL`: Copy from your current `.env.local`
- `REDIS_URL`: From your Upstash dashboard
- `NEXTAUTH_URL`: Your Vercel app URL (e.g., `https://radio-mgmt.vercel.app`)

#### Step 2.3: Deploy

Click "Create Web Service" - Render will automatically deploy and give you a URL like:
```
https://radio-socket-server.onrender.com
```

### 3. Vercel Next.js Frontend Setup

The Vercel deployment already handles the frontend. Just ensure the environment variable is set:

#### Add to Vercel Settings → Environment Variables:

```
NEXT_PUBLIC_SOCKET_SERVER_URL=https://radio-socket-server.onrender.com
```

This tells the frontend where to find the Socket.IO server.

### 4. Local Development Setup

For local development, you have two options:

#### Option A: Use Local Socket Server (Recommended)

1. Keep your local Redis running:
   ```bash
   # Terminal 1
   redis-cli
   ```

2. Terminal 2 - Start Next.js frontend:
   ```bash
   npm run dev
   ```

3. Terminal 3 - Start Socket.IO server:
   ```bash
   npm run dev:socket
   ```

The app will use `http://localhost:3001` for Socket.IO (default).

#### Option B: Use Render Socket Server Locally

Set in `.env.local`:
```
NEXT_PUBLIC_SOCKET_SERVER_URL=https://radio-socket-server.onrender.com
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:YOUR_PORT
```

Then just run:
```bash
npm run dev
```

## Environment Variables Summary

### Vercel (.env in project root or Dashboard)
```
NEXTAUTH_URL=https://your-vercel-app.vercel.app
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SOCKET_SERVER_URL=https://radio-socket-server.onrender.com
```

### Render (Dashboard → Environment)
```
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://...
REDIS_URL=redis://default:...@....upstash.io:...
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

### Local Development (.env.local)
```
# For local Socket server
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001

# Or for Render Socket server
REDIS_URL=redis://default:...@....upstash.io:...
NEXT_PUBLIC_SOCKET_SERVER_URL=https://radio-socket-server.onrender.com
```

## Testing the Connection

### 1. Test Socket Connection in Browser

Open the app and check the browser console:
```
✅ Socket connected: [socket-id]
```

### 2. Check Render Logs

In Render Dashboard:
- Select `radio-socket-server`
- Click "Logs" tab
- Should see: `✅ Socket.IO Redis adapter initialized`

### 3. Test Real-time Features

- Open the app in two browser tabs
- Try any real-time feature (e.g., on-air dashboard)
- Changes should sync instantly between tabs

## Troubleshooting

### Problem: Socket connection times out

**Solution:**
1. Verify `NEXT_PUBLIC_SOCKET_SERVER_URL` is set correctly in Vercel
2. Check Render service is running (not spinning down)
3. Verify CORS settings in `lib/socket/server.ts`

### Problem: Redis connection error in Render

**Solution:**
1. Verify `REDIS_URL` is correct in Render environment
2. Check Upstash connection limits aren't exceeded
3. Review Render logs for specific error

### Problem: Local Socket won't connect

**Solution:**
1. Ensure `npm run dev:socket` is running
2. Check `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001`
3. Verify local Redis is running: `redis-cli ping`

## Monitoring

### Render Free Tier Notes

- Services spin down after 15 minutes of inactivity
- Takes ~30 seconds to spin back up
- Perfect for development/demos
- Consider upgrading for production

### Monitor on Render Dashboard

- Logs: Real-time server logs
- Metrics: CPU, Memory, Disk usage
- Events: Deployment history

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Render service
3. ✅ Set environment variables on Render
4. ✅ Deploy to Vercel
5. ✅ Set `NEXT_PUBLIC_SOCKET_SERVER_URL` on Vercel
6. ✅ Test Socket.IO connection
7. ✅ Monitor logs for errors

## Quick Reference

**Local Development:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Socket Server
npm run dev:socket
```

**Deployment:**
- Frontend: Vercel (no changes needed)
- Socket Server: Render (use `NODE_ENV=production tsx server.ts`)
- Database: Your current provider
- Cache: Upstash Redis

**Connection Flow:**
```
Browser → Vercel Frontend → Render Socket Server → Upstash Redis
```
