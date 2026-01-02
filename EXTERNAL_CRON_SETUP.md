# External Cron Job Setup (Free)

Since Vercel's free plan only allows 2 cron jobs, here are free alternatives to run your automated billing tasks.

## ⭐ Recommended: cron-job.org (100% Free)

### Features
- ✅ Unlimited cron jobs (free forever)
- ✅ 1-minute minimum interval
- ✅ Monitoring and notifications
- ✅ Execution history
- ✅ Email alerts on failures
- ✅ No credit card required

### Setup Steps

#### 1. Create Account
1. Go to https://cron-job.org
2. Click "Sign up for free"
3. Create account (no credit card needed)
4. Verify email

#### 2. Add Generate Bills Job

1. Click "Create cron job"
2. Configure:
   ```
   Title: Radio Management - Generate Bills
   URL: https://your-domain.vercel.app/api/cron/generate-bills
   Schedule: Day of month = 20, Hour = 6, Minute = 0

   Request Method: POST

   Request Headers:
   Name: Authorization
   Value: Bearer YOUR_CRON_SECRET
   ```
3. Click "Create"

#### 3. Add Check Overdue Bills Job

1. Click "Create cron job"
2. Configure:
   ```
   Title: Radio Management - Check Overdue Bills
   URL: https://your-domain.vercel.app/api/cron/check-overdue-bills
   Schedule: Every day at 09:00

   Request Method: POST

   Request Headers:
   Name: Authorization
   Value: Bearer YOUR_CRON_SECRET
   ```
3. Click "Create"

### Cron Schedule Formats

**Generate Bills** (20th of month at 6:00 AM):
- Minute: 0
- Hour: 6
- Day of month: 20
- Month: *
- Day of week: *

**Check Overdue Bills** (Daily at 9:00 AM):
- Minute: 0
- Hour: 9
- Day of month: *
- Month: *
- Day of week: *

---

## Alternative 1: EasyCron (Free Tier)

### Features
- ✅ 100 tasks/month on free plan
- ✅ Good for low-frequency jobs
- ✅ Simple interface

### Setup
1. Go to https://www.easycron.com
2. Sign up for free account
3. Add cron jobs with same URLs and headers as above

---

## Alternative 2: Pipedream (Free Developer Plan)

### Features
- ✅ Scheduled workflows
- ✅ 10,000 invocations/month free
- ✅ More powerful (can add logic)
- ✅ Built-in monitoring

### Setup

#### 1. Create Account
1. Go to https://pipedream.com
2. Sign up for free

#### 2. Create Generate Bills Workflow

1. Click "New Workflow"
2. Add trigger: "Schedule"
   - Cron expression: `0 6 20 * *` (20th at 6 AM)
3. Add step: "HTTP Request"
   ```javascript
   Method: POST
   URL: https://your-domain.vercel.app/api/cron/generate-bills
   Headers: {
     "Authorization": "Bearer YOUR_CRON_SECRET"
   }
   ```
4. Deploy workflow

#### 3. Create Check Overdue Bills Workflow

1. Click "New Workflow"
2. Add trigger: "Schedule"
   - Cron expression: `0 9 * * *` (Daily at 9 AM)
3. Add step: "HTTP Request"
   ```javascript
   Method: POST
   URL: https://your-domain.vercel.app/api/cron/check-overdue-bills
   Headers: {
     "Authorization": "Bearer YOUR_CRON_SECRET"
   }
   ```
4. Deploy workflow

---

## Alternative 3: GitHub Actions (100% Free)

### Features
- ✅ Completely free for public repos
- ✅ Version controlled
- ✅ Runs in your repo

### Setup

Create `.github/workflows/cron-bills.yml`:

```yaml
name: Generate Monthly Bills

on:
  schedule:
    # Runs at 6:00 AM on the 20th of every month
    - cron: '0 6 20 * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  generate-bills:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Bills
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/generate-bills \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Create `.github/workflows/cron-overdue.yml`:

```yaml
name: Check Overdue Bills

on:
  schedule:
    # Runs daily at 9:00 AM
    - cron: '0 9 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  check-overdue:
    runs-on: ubuntu-latest
    steps:
      - name: Check Overdue Bills
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/check-overdue-bills \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Setup GitHub Secret:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CRON_SECRET`
4. Value: Your CRON_SECRET from .env
5. Click "Add secret"

---

## Alternative 4: Google Cloud Scheduler (Free Tier)

### Features
- ✅ 3 free jobs per month
- ✅ Enterprise reliability
- ✅ Part of Google Cloud

### Setup
1. Go to https://console.cloud.google.com/cloudscheduler
2. Create project (free tier)
3. Enable Cloud Scheduler API
4. Create jobs with HTTP targets

---

## Alternative 5: Render Cron Jobs (Free)

### Features
- ✅ Free cron jobs on free plan
- ✅ Good if you also host there

### Setup
1. Sign up at https://render.com
2. Create "Cron Job" service
3. Configure with your URLs

---

## Comparison Table

| Service | Cost | Jobs Limit | Reliability | Setup Difficulty |
|---------|------|------------|-------------|------------------|
| **cron-job.org** | Free | Unlimited | High | Easy ⭐ |
| EasyCron | Free | 100/month | Medium | Easy |
| Pipedream | Free | 10K/month | High | Medium |
| GitHub Actions | Free | Unlimited | High | Medium |
| Google Cloud | Free | 3 jobs | Very High | Hard |
| Render | Free | Unlimited | High | Medium |

---

## ⭐ Recommended Setup: cron-job.org

**Why:**
- Completely free forever
- Unlimited jobs
- Easy setup (5 minutes)
- Reliable
- Email notifications
- No coding required

**Steps:**
1. Sign up at https://cron-job.org
2. Add 2 cron jobs with URLs and Authorization header
3. Done!

---

## Remove Vercel Cron Jobs

Once you've set up external cron jobs, remove them from Vercel:

### Option 1: Remove from vercel.json

Edit `vercel.json` and remove the `crons` section:

```json
{
  "buildCommand": "npm run build -- --webpack",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Keep vercel.json as Documentation

You can also keep it for documentation but it won't create actual cron jobs on free plan.

---

## Testing Your Cron Jobs

### Manual Test via cron-job.org
1. Click on your cron job
2. Click "Run now"
3. Check execution history
4. Verify logs in your application

### Manual Test via curl
```bash
# Test Generate Bills
curl -X POST https://your-domain.vercel.app/api/cron/generate-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test Check Overdue Bills
curl -X POST https://your-domain.vercel.app/api/cron/check-overdue-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Monitoring

### cron-job.org Dashboard
- Execution history
- Success/failure rates
- Email alerts on failures
- Response times

### Your Application Logs
- Check Vercel logs after cron execution
- Verify bills are created
- Check emails are sent (Resend dashboard)

---

## Security Notes

1. **Keep CRON_SECRET secure** - Don't share it publicly
2. **Use HTTPS** - All external cron services should use HTTPS URLs
3. **Monitor failures** - Set up email alerts
4. **Validate requests** - Your API already validates the Bearer token

---

## Troubleshooting

### Cron job returns 401 Unauthorized
- Check Authorization header is set correctly
- Verify CRON_SECRET matches between service and .env
- Ensure format is: `Bearer YOUR_SECRET` (note the space)

### Cron job doesn't execute
- Check schedule is configured correctly
- Verify URL is accessible publicly
- Check cron service execution logs
- Test URL manually with curl

### Bills not generated
- Check Vercel logs for errors
- Verify database connection
- Check cron job execution history
- Test API endpoint manually

---

## Cost Comparison

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Vercel Pro** (for cron) | $20 | Unlimited cron jobs |
| **cron-job.org** | $0 | Free forever ⭐ |
| **GitHub Actions** | $0 | Free for public repos |
| **Pipedream** | $0 | 10K invocations/month |

**Savings: $20/month** by using cron-job.org instead of upgrading Vercel plan just for cron jobs!

---

## Recommendation

**Use cron-job.org** - It's the simplest, most reliable, and completely free solution for your use case.

Setup time: 5 minutes
Cost: $0/month
Reliability: High
Maintenance: None

---

**Created:** January 2, 2026
**Status:** Ready to implement
**Recommended:** cron-job.org
