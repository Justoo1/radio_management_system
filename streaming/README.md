# AzuraCast Local Development Setup

This directory contains the Docker configuration for running AzuraCast locally for RMS streaming feature development.

## Prerequisites

- **Docker Desktop** for Windows (installed and running)
- **4GB+ RAM** available for Docker
- **10GB+ disk space** for AzuraCast data

## Quick Start

### 1. Start AzuraCast

```batch
cd streaming
azuracast.bat start
```

Or using Docker Compose directly:

```batch
docker compose up -d
```

### 2. Wait for Initialization

First startup takes **2-3 minutes**. Watch the logs:

```batch
azuracast.bat logs
```

Wait until you see:
```
azuracast  | AzuraCast is now running!
```

### 3. Access AzuraCast

| Service | URL |
|---------|-----|
| **Web Interface** | http://localhost:8080 |
| **Stream URL** | http://localhost:8000/radio.mp3 |

### 4. Login

**Default Admin Credentials:**
- Email: `admin@rms.local`
- Password: `rmsadmin123`

> Change the password after first login!

---

## Management Commands

Use the `azuracast.bat` script:

| Command | Description |
|---------|-------------|
| `azuracast.bat start` | Start AzuraCast |
| `azuracast.bat stop` | Stop AzuraCast |
| `azuracast.bat restart` | Restart AzuraCast |
| `azuracast.bat status` | Check if running |
| `azuracast.bat logs` | View logs (follow mode) |
| `azuracast.bat shell` | Open bash in container |
| `azuracast.bat reset` | Delete all data and start fresh |

---

## Getting Your API Key

The API key is required for RMS to communicate with AzuraCast.

1. Login to AzuraCast at http://localhost:8080
2. Click your profile icon (top right)
3. Select **My Account**
4. Go to **API Keys** tab
5. Click **Add API Key**
6. Give it a name: `RMS Development`
7. Copy the generated key

Add to your `.env` file:
```env
AZURACAST_API_KEY=your-copied-api-key
```

---

## Creating Your First Station

### Via Web Interface

1. Login to AzuraCast
2. Click **Add Station**
3. Fill in:
   - **Name**: `Test Radio`
   - **Short Name**: `testradio`
   - **Genre**: `Various`
4. Click **Save**
5. Your station is created!

### Station URLs

After creation, your station will have:

| Mount Point | URL |
|-------------|-----|
| `/radio.mp3` | http://localhost:8000/radio.mp3 |
| Low Quality | http://localhost:8000/radio-lo.mp3 |

---

## Uploading Music

### Via Web Interface

1. Go to your station
2. Click **Media** in sidebar
3. Click **Upload Files**
4. Drag & drop MP3 files

### Via SFTP

Connect with any SFTP client:
- **Host**: `localhost`
- **Port**: `2022`
- **Username**: Your DJ username
- **Password**: Your DJ password

---

## Creating a DJ Account (for Live Broadcasting)

1. Go to your station
2. Click **Streamers/DJs** in sidebar
3. Click **Add Streamer**
4. Fill in:
   - **Username**: `dj1`
   - **Password**: `djpassword`
   - **Display Name**: `DJ One`
5. Save

### DJ Connection Info

Give DJs these settings for their broadcast software (OBS, BUTT, etc.):

| Setting | Value |
|---------|-------|
| **Server Type** | Icecast |
| **Host** | `localhost` |
| **Port** | `8005` |
| **Mount** | `/radio.mp3` |
| **Username** | `dj1` |
| **Password** | `djpassword` |

---

## Testing the Stream

### In Browser

Open: http://localhost:8000/radio.mp3

### In VLC

1. Open VLC
2. Media > Open Network Stream
3. Enter: `http://localhost:8000/radio.mp3`
4. Play

### Quick Test with PowerShell

```powershell
# Check if stream is active
Invoke-WebRequest -Uri "http://localhost:8000/radio.mp3" -Method Head
```

---

## API Testing

### Check Now Playing

```powershell
# Get now playing info
Invoke-RestMethod -Uri "http://localhost:8080/api/nowplaying/1"
```

### With API Key

```powershell
$headers = @{ "X-API-Key" = "your-api-key" }
Invoke-RestMethod -Uri "http://localhost:8080/api/station/1" -Headers $headers
```

---

## Ports Reference

| Port | Service | Description |
|------|---------|-------------|
| 8080 | HTTP | AzuraCast web interface |
| 8443 | HTTPS | AzuraCast secure web |
| 8000-8010 | Icecast | Stream output ports |
| 2022 | SFTP | File upload |

---

## Troubleshooting

### Container won't start

```batch
:: Check Docker is running
docker info

:: Check for port conflicts
netstat -an | findstr "8080"
netstat -an | findstr "8000"

:: View detailed logs
docker compose logs azuracast
```

### Can't access web interface

1. Wait 2-3 minutes after starting
2. Check container status: `azuracast.bat status`
3. Check logs for errors: `azuracast.bat logs`

### Stream not working

1. Ensure you've uploaded music to your station
2. Check if AutoDJ is enabled:
   - Station > Profile > AutoDJ > Enable
3. Restart the station from the web UI

### Reset everything

```batch
azuracast.bat reset
azuracast.bat start
```

---

## Resource Usage

Expected resource usage:

| Resource | Idle | With Listeners |
|----------|------|----------------|
| **CPU** | 1-5% | 5-15% |
| **RAM** | 500MB-1GB | 1-2GB |
| **Disk** | 2GB base | + media files |

---

## Integration with RMS

Once AzuraCast is running, update your RMS `.env`:

```env
# AzuraCast Integration
AZURACAST_URL=http://localhost:8080
AZURACAST_API_KEY=your-api-key-from-step-above
AZURACAST_WEBHOOK_SECRET=dev-webhook-secret
```

Then in your RMS code, the streaming service can connect:

```typescript
// This will connect to your local AzuraCast
const azuraCast = createAzuraCastService({
  baseUrl: process.env.AZURACAST_URL,
  apiKey: process.env.AZURACAST_API_KEY,
});
```

---

## Next Steps

After setup:

1. [ ] Create a test station
2. [ ] Upload some test audio files
3. [ ] Get your API key
4. [ ] Test the stream in VLC/browser
5. [ ] Create a DJ account and test live broadcasting
6. [ ] Start developing the RMS streaming integration!

---

## Useful Links

- [AzuraCast Documentation](https://www.azuracast.com/docs/)
- [AzuraCast API Reference](https://www.azuracast.com/docs/developers/api/)
- [AzuraCast GitHub](https://github.com/AzuraCast/AzuraCast)
