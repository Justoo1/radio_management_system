# Database Scripts

This directory contains utility scripts for managing the database.

## Subscription Plans Seed Script

### Purpose
Seeds the database with the correct subscription plans that match the pricing displayed on the marketing and upgrade pages.

### Plans Created
- **Starter**: GHS 500/month - For small radio stations
- **Professional**: GHS 1,200/month - For growing stations (Most Popular)
- **Enterprise**: Custom pricing - For large stations

### How to Run

1. Make sure you have `tsx` installed:
```bash
npm install -D tsx
```

2. Run the seed script:
```bash
npx tsx scripts/seed-subscription-plans.ts
```

### What It Does
- Creates or updates all three subscription plans in the database
- Uses `upsert` to safely update existing plans or create new ones
- Sets correct pricing, limits, and features for each tier
- Ensures plans match the pricing pages

### When to Run
- After initial database setup
- When subscription plan details need to be updated
- If you notice plan pricing mismatches

### Notes
- This script is safe to run multiple times (uses upsert)
- Existing subscriptions won't be affected
- Only the plan definitions are updated
