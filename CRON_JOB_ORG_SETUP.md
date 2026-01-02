# cron-job.org Setup Guide (5 Minutes)

Quick setup guide for free cron jobs using cron-job.org.

## ✅ Why cron-job.org?

- ✅ **100% Free** - No credit card, no limits
- ✅ **Unlimited Jobs** - As many as you need
- ✅ **Reliable** - Running since 2006
- ✅ **Monitoring** - Email alerts, execution history
- ✅ **Easy Setup** - 5 minutes total

## 🚀 Step-by-Step Setup

### Step 1: Create Account (1 min)

1. Go to: https://cron-job.org/en/signup/
2. Fill in:
   - Email address
   - Password
   - Check "I accept the terms"
3. Click "Sign up"
4. Check your email and verify your account

### Step 2: Add Generate Bills Job (2 min)

1. Login to https://cron-job.org
2. Click **"CREATE CRONJOB"** button
3. Fill in the form:

```
Title:
  Radio Management - Generate Bills

URL:
  https://your-vercel-domain.vercel.app/api/cron/generate-bills

Schedule:
  ☑ Enabled

  Minute:       0
  Hour:         6
  Day of month: 20
  Month:        *
  Day of week:  *

  (This means: Run at 6:00 AM on the 20th of every month)

Advanced:
  Request method: POST

  Custom request headers:
  Name:  Authorization
  Value: Bearer YOUR_CRON_SECRET_HERE

Notifications:
  ☑ On failure
  (Your email will be pre-filled)
```

4. Click **"CREATE CRONJOB"**

### Step 3: Add Check Overdue Bills Job (2 min)

1. Click **"CREATE CRONJOB"** again
2. Fill in the form:

```
Title:
  Radio Management - Check Overdue Bills

URL:
  https://your-vercel-domain.vercel.app/api/cron/check-overdue-bills

Schedule:
  ☑ Enabled

  Minute:       0
  Hour:         9
  Day of month: *
  Month:        *
  Day of week:  *

  (This means: Run every day at 9:00 AM)

Advanced:
  Request method: POST

  Custom request headers:
  Name:  Authorization
  Value: Bearer YOUR_CRON_SECRET_HERE

Notifications:
  ☑ On failure
```

3. Click **"CREATE CRONJOB"**

### Step 4: Test Your Jobs (1 min)

1. Find your cron job in the list
2. Click the **play icon (▶)** to run manually
3. Check the "Execution history" tab
4. Verify:
   - Status: Success (green checkmark)
   - Response code: 200
   - No errors in execution log

## 📋 Configuration Reference

### Your URLs

Replace `your-vercel-domain` with your actual Vercel deployment URL:

```bash
# Generate Bills Job
https://your-app.vercel.app/api/cron/generate-bills

# Check Overdue Bills Job
https://your-app.vercel.app/api/cron/check-overdue-bills
```

### Your CRON_SECRET

Get it from your `.env` file:

```bash
# In your .env file
CRON_SECRET=your-secret-key-here
```

Then use it in the header:
```
Authorization: Bearer your-secret-key-here
```

**Important:** Include "Bearer " before the secret!

## 📊 Monitoring & Management

### View Execution History

1. Click on a cron job name
2. Go to "Execution history" tab
3. See all past executions with:
   - Timestamp
   - Response code
   - Response time
   - Response body (if any errors)

### Email Notifications

You'll receive email alerts when:
- ✅ Job fails (non-200 response)
- ✅ Job times out
- ✅ Server unreachable

### Edit Existing Job

1. Click on job name
2. Click "Edit" button
3. Make changes
4. Click "Save"

### Pause/Resume Job

1. Click the toggle switch next to the job name
2. Gray = Paused, Green = Active

### Delete Job

1. Click on job name
2. Click "Delete" button
3. Confirm deletion

## 🧪 Testing

### Test Generate Bills Job

```bash
# Open terminal and run:
curl -X POST https://your-vercel-domain.vercel.app/api/cron/generate-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "message": "Created X bills for Y organizations",
  "bills": [...]
}
```

### Test Check Overdue Bills Job

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/cron/check-overdue-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "message": "Processed X overdue bills",
  "notifications": [...]
}
```

## 🔧 Troubleshooting

### ❌ Error: 401 Unauthorized

**Problem:** Authorization header incorrect

**Fix:**
1. Check CRON_SECRET in your Vercel environment variables
2. Ensure you're using: `Bearer YOUR_SECRET` (with space)
3. Verify the secret matches exactly

### ❌ Error: 500 Internal Server Error

**Problem:** Server error in your application

**Fix:**
1. Check Vercel logs
2. Test the endpoint manually
3. Verify database and Redis are connected
4. Check environment variables are set

### ❌ Job Not Executing

**Problem:** Schedule might be incorrect

**Fix:**
1. Verify the cron job is enabled (green toggle)
2. Check the schedule settings
3. Test by clicking "Run now"
4. Check execution history for errors

### ❌ Timeout Error

**Problem:** Request taking too long

**Fix:**
1. Check your database connection speed
2. Optimize queries if needed
3. Increase timeout in cron-job.org settings:
   - Click job → Edit
   - Advanced → Timeout: 60 seconds

## 📅 Schedule Examples

### Common Schedules

| Description | Minute | Hour | Day | Month | Weekday |
|-------------|--------|------|-----|-------|---------|
| Every day at 9 AM | 0 | 9 | * | * | * |
| Every Monday at 10 AM | 0 | 10 | * | * | 1 |
| 1st of month at 6 AM | 0 | 6 | 1 | * | * |
| 20th of month at 6 AM | 0 | 6 | 20 | * | * |
| Every 6 hours | 0 | */6 | * | * | * |
| Every hour | 0 | * | * | * | * |

### Your Schedules

**Generate Bills:**
```
0 6 20 * * = At 6:00 AM on the 20th of every month
```

**Check Overdue:**
```
0 9 * * * = At 9:00 AM every day
```

## 💡 Pro Tips

1. **Test First**
   - Always test jobs manually before relying on schedule
   - Check execution history after first scheduled run

2. **Monitor Regularly**
   - Check execution history weekly
   - Verify emails are being sent (check Resend dashboard)
   - Monitor your database for created bills

3. **Set Up Alerts**
   - Enable email notifications for failures
   - Add secondary email if needed
   - Check spam folder for notification emails

4. **Document Your Setup**
   - Save your cron job URLs
   - Document the schedule
   - Keep CRON_SECRET secure

## ✅ Verification Checklist

After setup, verify:

- [ ] Both cron jobs created in cron-job.org
- [ ] Both jobs showing as "Enabled" (green)
- [ ] Manual test of both jobs successful
- [ ] Execution history shows successful runs
- [ ] Email notifications configured
- [ ] Vercel logs show successful API calls
- [ ] Bills are created in database (for generate-bills job)
- [ ] Emails are sent (for check-overdue job)

## 📞 Support

### cron-job.org Help
- Support: https://cron-job.org/en/documentation/
- FAQ: https://cron-job.org/en/faq/
- Contact: support@cron-job.org

### Your Application Logs
- Vercel: https://vercel.com/dashboard
- Check deployment logs
- Monitor function execution

## 💰 Cost

**Total Cost: $0/month** ✅

No credit card required, unlimited cron jobs, free forever!

---

**Setup Time:** ~5 minutes
**Difficulty:** Easy
**Cost:** Free
**Reliability:** High

You're all set! Your billing automation is now running on free cron jobs! 🎉
