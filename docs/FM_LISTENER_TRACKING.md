# Traditional FM Radio Listener Tracking & Rating System

## Overview

Since this is a **traditional FM radio station** (not digital streaming), we track listener **engagement** rather than direct listener counts. This system uses real data from listener interactions to measure program popularity and engagement.

## How It Works for FM Radio

### Data Sources (Already in Your System!)

1. **SMS Listener Requests** ✅
   - You already have SMS campaigns
   - Listeners send song requests, dedications, shoutouts via SMS
   - Each request = engagement data point

2. **WhatsApp Interactions** ✅
   - You have WhatsApp integration in the schema
   - Listeners send messages, requests via WhatsApp
   - Tracks engagement per program

3. **Phone Call-ins** ✅
   - ListenerRequest model tracks phone calls
   - Contest entries, questions, comments
   - Real-time engagement during shows

4. **Program Ratings** ✅ (NEW)
   - Listeners can rate programs 1-5 stars
   - Can be collected via:
     - Website/mobile app forms
     - SMS rating system ("Rate this program 1-5")
     - Social media polls

5. **Online Streaming** ✅ (Optional)
   - If you have a website/app stream
   - Tracks actual listening sessions
   - Complements FM broadcast data

## What the Reports Show

### Metrics (All Based on REAL Data)

1. **Total Engagement** (labeled as "Total Listeners")
   - Sum of all listener requests (SMS + WhatsApp + Phone)
   - Plus online streaming sessions if available
   - Shows how many times listeners interacted with programs

2. **Average Rating**
   - Real ratings submitted by listeners
   - 1-5 star scale
   - Shows 0.0 until ratings are submitted

3. **Engagement Retention**
   - Percentage of recent engagement (last 30 days) vs all-time
   - Shows if programs are maintaining engagement
   - Higher % = consistent audience interaction

4. **Monthly Growth**
   - Compares current month engagement to last month
   - Positive % = growing engagement
   - Negative % = declining engagement

5. **Peak Engagement Hour**
   - Hour with most listener requests
   - Shows when your audience is most active
   - Based on actual request timestamps

## How to Collect Engagement Data

### 1. SMS Listener Requests (Already Working!)

Your system already tracks this via the `ListenerRequest` model:

```typescript
// When a listener sends SMS to request a song
await prisma.listenerRequest.create({
  data: {
    organizationId,
    programId,
    listenerName: "John",
    listenerPhone: "+233123456789",
    requestType: "SONG_REQUEST",
    songTitle: "Shape of You",
    songArtist: "Ed Sheeran",
    source: "SMS",
    status: "PENDING",
  }
})
```

### 2. Program Ratings via SMS

You can set up an automated SMS rating system:

**Example Flow:**
- After a program ends, send SMS: "How would you rate today's Morning Show? Reply with 1-5 stars"
- When listener replies with "5", your system:

```typescript
// Create rating from SMS response
await fetch(`/api/programs/${programId}/rate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rating: 5,
    listenerName: "John",
    listenerEmail: null,
    review: null,
  })
})
```

### 3. WhatsApp Engagement

```typescript
// When listener sends WhatsApp message during a show
await prisma.listenerRequest.create({
  data: {
    organizationId,
    programId,
    listenerPhone: "+233123456789",
    requestType: "SHOUTOUT",
    message: "Shout out to my friend Sarah!",
    source: "WHATSAPP",
    status: "APPROVED",
  }
})
```

### 4. Website/Mobile App Ratings

Add a rating widget to your website:

```html
<!-- Example rating form -->
<div class="program-rating">
  <h3>Rate this Program</h3>
  <div class="stars">
    <button onclick="rateProgram(1)">⭐</button>
    <button onclick="rateProgram(2)">⭐⭐</button>
    <button onclick="rateProgram(3)">⭐⭐⭐</button>
    <button onclick="rateProgram(4)">⭐⭐⭐⭐</button>
    <button onclick="rateProgram(5)">⭐⭐⭐⭐⭐</button>
  </div>
  <textarea placeholder="Write a review (optional)"></textarea>
</div>

<script>
async function rateProgram(stars) {
  await fetch('/api/programs/PROGRAM_ID/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: stars,
      review: document.querySelector('textarea').value,
      listenerName: 'Anonymous'
    })
  })
  alert('Thank you for rating!')
}
</script>
```

## Understanding the Metrics

### "Total Listeners" = Total Engagement

In the context of FM radio, this number represents:
- Number of listener requests (SMS, WhatsApp, Phone)
- Number of online streaming sessions (if available)
- **NOT** the total number of people listening to FM broadcast

**Example:**
- Program has 50 SMS requests + 30 WhatsApp messages = 80 "listeners" (engagement points)

### "Retention" = Engagement Consistency

Shows how consistent your engagement is:
- 80% retention = Most engagement happened recently (good!)
- 20% retention = Most engagement was in the past (declining)

### "Rating" = Listener Satisfaction

Direct feedback from listeners:
- 4.5+ = Excellent program
- 3.0-4.4 = Good program
- Below 3.0 = Needs improvement

## Setting Up for Your Station

### Step 1: Start Collecting Ratings

Add a rating system to your website or create an SMS rating campaign:

**SMS Campaign Example:**
```
"How would you rate today's Morning Vibes with DJ Mike?
Reply with a number 1-5:
1 = Poor
5 = Excellent

Your feedback helps us improve!"
```

### Step 2: Encourage Listener Requests

Promote interaction during shows:
- "Send us your song requests via WhatsApp: +233-XXX-XXXX"
- "Text us your dedications to 1234"
- "Call in now: 0XX-XXX-XXXX"

All these interactions automatically track to the program!

### Step 3: Monitor the Reports

Visit `/reports/programs` to see:
- Which programs have the most engagement
- What times listeners are most active
- How ratings compare across programs
- Monthly growth trends

## Current State

Right now, your reports will show:
- ✅ **Real data** from ListenerRequests (SMS, WhatsApp, Phone)
- ❌ **0 ratings** (until listeners start rating)
- ❌ **0 online sessions** (unless you have streaming)

As listeners interact more (requests, ratings), the data will automatically populate with **real metrics** instead of simulated estimates.

## API Endpoints Reference

### Submit a Rating
```
POST /api/programs/[programId]/rate
```

### Get Program Ratings
```
GET /api/programs/[programId]/rate
```

### Track Online Listening Session (if you add streaming)
```
POST /api/listener/session
PUT /api/listener/session
GET /api/listener/session?programId=xxx
```

## Benefits of This Approach

✅ **Real Data** - No more simulated numbers, actual listener engagement
✅ **FM Compatible** - Works with traditional broadcast radio
✅ **Multiple Channels** - Combines SMS, WhatsApp, Phone, Web
✅ **Actionable Insights** - See which programs resonate with listeners
✅ **Growth Tracking** - Monitor engagement trends over time

## Next Steps

1. ✅ Database schema updated (ProgramRating added)
2. ✅ API endpoints created
3. ✅ Reports using real engagement data
4. 🔲 Add rating forms to your website
5. 🔲 Set up SMS rating campaigns
6. 🔲 Promote listener interaction during shows
7. 🔲 Monitor and analyze the engagement data

Your system is now ready to track real listener engagement for traditional FM radio!
