# Radio Management System (RMS) - Project Memory

## Project Overview

**Type**: Multi-Tenant SaaS Application  
**Purpose**: Comprehensive management system for radio stations in Ghana  
**Target Market**: Traditional FM radio broadcasters (with optional digital streaming support)  
**Business Model**: 
- Monthly Subscription: GH₵500/month
- One-time Purchase: GH₵9,000 (18-month break-even)
- 7-day trial period for all new organizations

## Technology Stack

### Core Framework
- **Frontend**: Next.js 16+ (App Router), React 19+, TypeScript
- **Styling**: TailwindCSS, Shadcn/ui component library
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Credentials Provider)

### Key Dependencies
```json
{
  "next": "^16.1.1",
  "react": "^19.2.3",
  "prisma": "^6.19.0",
  "next-auth": "^5.0.0-beta.30",
  "zod": "^4.1.12",
  "socket.io": "^4.8.1",
  "socket.io-client": "^4.8.1",
  "recharts": "^2.15.4",
  "zustand": "^5.0.8",
  "ioredis": "^5.8.2",
  "@socket.io/redis-adapter": "^8.3.0",
  "bullmq": "^5.63.2",
  "bcryptjs": "^3.0.3",
  "react-hook-form": "^7.66.0",
  "resend": "^6.6.0",
  "next-pwa": "^5.6.0"
}
```

### External Services & Integrations
- **Payment Processing**: Hubtel Mobile Money (MTN, Vodafone, AirtelTigo) - Primary for Ghana, Stripe for international
- **SMS Gateway**: Hubtel SMS API or Africa's Talking
- **File Storage**: AWS S3 or Cloudinary
- **Email**: Resend API (transactional emails, billing notifications)
- **Caching & Real-Time**: Redis/Upstash for Socket.IO adapter and caching
- **Queue Management**: BullMQ with Redis for background jobs
- **PWA**: next-pwa for Progressive Web App capabilities

## Project Structure

```
D:\projects\radio_management_system\
├── app/
│   ├── (admin)/          # Admin dashboard for super users
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── (marketing)/      # Public landing pages
│   ├── api/              # API routes (59 endpoints)
│   └── actions/          # Server actions
├── components/
│   ├── ui/               # Shadcn components
│   ├── layouts/          # Layout components
│   ├── dashboard/        # Dashboard-specific
│   └── [features]/       # Feature-specific components
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth config
│   ├── redis.ts          # Redis client & channels
│   ├── validations/      # Zod schemas (13 schemas)
│   ├── services/         # Business logic (client, program, onair, sms, org)
│   ├── pdf-generator.ts  # PDF generation utilities
│   ├── features.ts       # Feature flag system
│   └── subscription-access.ts  # Subscription validation
├── hooks/                # Custom React hooks
├── store/                # Zustand stores (auth, org, clients, programs, ui)
├── types/                # TypeScript definitions
├── config/               # Site, navigation, permissions config
├── emails/               # Email templates (Resend)
├── scripts/              # Database seeding scripts
├── prisma/
│   └── schema.prisma     # Database schema (50 models)
├── public/               # Static assets
├── server.ts             # Custom HTTP + Socket.IO server
└── docs/                 # Documentation files
```

## Database Architecture

### Multi-Tenancy Strategy
**Approach**: Row-Level Multi-Tenancy
- Every business data model includes `organizationId` field
- All queries MUST filter by `organizationId` for data isolation
- Critical security requirement: Never expose data across organizations

### Key Models (50 total)
**Core Tenancy**:
- `Organization` - Radio station tenant
- `User` - Scoped to organization
- `Role` & `Permission` - RBAC system
- `Team` - Team grouping

**Subscription & Billing**:
- `Subscription` - Active subscription record
- `SubscriptionPlan` - Available plans
- `SubscriptionPayment` - Payment history

**Radio Operations**:
- `Program` - Radio shows/programs
- `ProgramSchedule` - When programs air
- `Episode` - Individual program episodes
- `Client` - Advertisers/sponsors
- `Contract` & `Invoice` - Financial documents
- `SMSCampaign` & `SMSMessage` - Bulk SMS system
- `MediaFile` - Audio/jingle library
- `AdCampaign` & `Advertisement` - Ad management

**Live On-Air** (WebSocket-powered):
- `OnAirNow` - Current live program
- `OnAirQueue` - Upcoming queue
- `Song` - Song library
- `InstantAudio` - Quick audio clips
- `ListenerRequest` - Live requests
- `Playlist` - Curated playlists
- `SongPlayHistory` - Play tracking

**Analytics** (Existing - Ready for AI enhancement):
- `ListenerSession` - Listener tracking
- `ListenerMetrics` - Aggregated metrics
- `ProgramRating` - Program ratings

**Communication**:
- `WhatsAppAccount` - WhatsApp Business integration
- `WhatsAppMessage` - Message history
- `Communication` - General communications log
- `ActivityLog` - Audit trail for all actions

**System & Configuration**:
- `OrganizationSetting` - Org-specific settings
- `Metric` - System metrics tracking
- `Bill` - Monthly organization bills

### Organization Status Flow
```
TRIAL (7 days) → ACTIVE (paid) → SUSPENDED (payment failed) → EXPIRED
                     ↑
                     └─ Can renew from SUSPENDED/EXPIRED
```

## User Roles & Permissions

**Role Hierarchy**:
1. **OWNER** - Full system access, billing management, delete organization
2. **ADMIN** - All modules except billing/subscription
3. **PROGRAM_MANAGER** - Programs, schedules, media library
4. **SALES_MANAGER** - Clients, contracts, invoices, advertising
5. **HOST** - View own programs, upload episodes
6. **VIEWER** - Read-only access to all modules

**Permission Model**:
- Resource-based (e.g., `clients`, `programs`, `sms`)
- Action-based (e.g., `create`, `read`, `update`, `delete`)
- Checked via `hasPermission(user, resource, action)` helper

## Core Features (Currently Implemented)

### ✅ Completed Modules
1. **Authentication & Authorization**
   - NextAuth v5 setup with credentials
   - Organization registration with auto 7-day trial
   - Multi-tenant session management
   - Role-based access control
   - Developer access control via security keys
   - Session verification middleware

2. **Program Management** (Fully Functional)
   - CRUD operations for programs
   - Schedule management (day/time slots)
   - Episode tracking
   - Host assignment
   - Calendar view of schedules
   - **Status**: Production-ready ✅

3. **Finance Management**
   - Client management
   - Contract creation
   - Invoice generation
   - Expense tracking
   - Bill management
   - Financial reporting

4. **Live On-Air Dashboard** (WebSocket-powered)
   - Real-time "Now Playing" display
   - Queue management
   - Instant audio triggers
   - Listener request handling
   - Playlist management
   - Song search and play history

5. **Team & User Management**
   - Team member invitations
   - Role assignment
   - User CRUD operations

6. **Reports & Analytics**
   - Dashboard metrics
   - Revenue reports
   - SMS usage tracking
   - Client analytics
   - P&L statements
   - Invoice aging analysis
   - Contract analysis reports
   - Program analytics

7. **Admin Dashboard** (Super User Features)
   - Organization management dashboard
   - Feature activation/deactivation per organization
   - Plan upgrades and downgrades
   - Payment creation and tracking
   - Revenue analytics across all organizations
   - Trial period management
   - Organization status control (suspend/cancel)

8. **Billing System**
   - Automated monthly bill generation
   - Subscription payment processing
   - Overdue payment tracking
   - Payment reminders via email
   - Multiple payment providers (Hubtel, Stripe)
   - Payment webhooks handling
   - Subscription invoices and receipts

9. **Automated Jobs** (External Cron)
   - Trial expiration checking
   - Payment status verification
   - Monthly bill generation
   - Overdue bill detection and alerts
   - Subscription renewal processing

### 🚧 Planned Features (Next Phase)

10. **Enhanced Listener Tracking** (Traditional FM Compatible)
   - Call-in tracking
   - SMS request analysis
   - WhatsApp interaction monitoring
   - Social media mention tracking
   - Contest participation tracking
   - Web/app streaming metrics (optional)

11. **AI-Powered Analytics** (Future Enhancement)
   - Sentiment analysis (SMS, WhatsApp, social media)
   - Program performance prediction
   - Optimal scheduling recommendations
   - Listener demographic insights
   - Content topic extraction
   - Engagement trend analysis

## Feature Locking System

**Overview**: Admin-controlled feature access per organization

### Lockable Features
Features can be enabled/disabled by admin regardless of subscription plan:
- SMS Campaigns
- Advertisements
- Media Library
- WhatsApp Integration
- Expenses
- Advanced Analytics
- Revenue Reports
- Contract Analysis Reports
- Invoice Aging Reports
- Client Analytics
- Program Analytics
- SMS Analytics

### Core Features (Always Enabled)
- Clients
- Programs
- Invoices
- Contracts
- Teams
- Reports (basic)
- On-Air Dashboard

### Implementation
```typescript
// Check if feature is enabled
const hasFeature = organization.enabledFeatures?.includes('SMS_CAMPAIGNS')

// In API routes
if (!hasFeature) {
  return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
}
```

## Critical Development Guidelines

### 1. Multi-Tenant Data Isolation (CRITICAL!)

**Always filter by organizationId**:
```typescript
// ❌ BAD - Security vulnerability!
const clients = await prisma.client.findMany()

// ✅ GOOD - Properly isolated
const clients = await prisma.client.findMany({
  where: { organizationId: session.user.organizationId }
})
```

### 2. Middleware Protection
Every protected route must:
- Check authentication (session exists)
- Verify organization status (not EXPIRED/SUSPENDED)
- Enforce feature limits before creation

### 3. Feature Limit Enforcement
Before creating resources:
```typescript
const clientCount = await prisma.client.count({
  where: { organizationId }
})

if (clientCount >= organization.maxClients) {
  throw new Error('Client limit reached. Upgrade plan.')
}
```

### 4. Trial & Subscription Logic

**On Registration**:
```typescript
trialStartDate: new Date()
trialEndDate: addDays(new Date(), 7)
status: 'TRIAL'
```

**Cron Job** (daily check):
- Find organizations with expired trials
- Update status to EXPIRED
- Send expiration emails

### 5. Payment Flow (Hubtel Mobile Money)

**Initiate Payment**:
```typescript
const payment = await hubtel.requestPayment({
  amount: plan.price,
  customerMsisdn: user.phone,
  description: `${org.name} Subscription`,
  callbackUrl: `/api/webhooks/hubtel`
})

await prisma.subscriptionPayment.create({
  data: {
    subscriptionId,
    amount: plan.price,
    provider: 'HUBTEL',
    status: 'PENDING',
    providerPaymentId: payment.transactionId
  }
})
```

**Webhook Handler**:
- Verify Hubtel signature
- Update payment status
- Activate subscription on success
- Update organization status to ACTIVE

### 6. SMS Campaign Flow
- Create campaign (DRAFT status)
- Select recipients (with organization filter!)
- Check SMS credit balance
- Send via gateway (Hubtel/Africa's Talking)
- Log each message
- Deduct credits
- Track delivery status

## API Endpoint Structure

### Naming Convention
```
/api/[resource]              # List, Create
/api/[resource]/[id]         # Get, Update, Delete
/api/[resource]/[id]/[sub]   # Nested resources
```

### Response Format
```typescript
// Success
{
  data: T | T[],
  total?: number,
  message?: string
}

// Error
{
  error: string,
  details?: any
}
```

### Common Endpoints (59 Total)

**Authentication (4 endpoints)**:
- `/api/auth/register` - New organization registration
- `/api/auth/[...nextauth]` - NextAuth flow
- `/api/auth/check-org-status` - Organization status check
- `/api/auth/session` - Session verification

**Admin (8 endpoints)**:
- `/api/admin/organizations` - List all organizations
- `/api/admin/organizations/[id]` - Get/update organization
- `/api/admin/organizations/[id]/features` - Feature management
- `/api/admin/organizations/[id]/plan` - Plan management
- `/api/admin/payments` - Payment tracking
- `/api/admin/revenue` - Revenue analytics

**Business Operations**:
- `/api/clients` - Client CRUD
- `/api/contracts` - Contract management
- `/api/invoices` - Invoice management & PDF
- `/api/programs` - Program management
- `/api/teams` - Team management
- `/api/users` - User management & invitations
- `/api/expenses` - Expense tracking

**SMS & Marketing**:
- `/api/sms/campaigns` - Campaign management
- `/api/sms/templates` - Template management
- `/api/sms/credits` - Credit management
- `/api/ads/campaigns` - Advertising campaigns

**On-Air Broadcasting (10 endpoints)**:
- `/api/onair/now` - Current playing item
- `/api/onair/queue` - Queue management
- `/api/onair/songs` - Song library
- `/api/onair/schedule` - Program schedule
- `/api/onair/requests` - Listener requests
- `/api/onair/instant-audios` - Instant playback
- `/api/onair/program/start` - Start program
- `/api/onair/program/queue` - Program queue

**Reports (8 endpoints)**:
- `/api/reports/financial/*` - Financial reports (P&L, revenue, aging)
- `/api/reports/clients` - Client analytics
- `/api/reports/programs` - Program analytics
- `/api/reports/sms` - SMS analytics
- `/api/reports/dashboard` - Dashboard metrics

**Billing & Subscription**:
- `/api/subscription/initiate-payment` - Payment initiation
- `/api/subscription/invoices` - Subscription invoices
- `/api/subscription/receipts` - Payment receipts
- `/api/subscription/upgrade` - Plan upgrades

**Cron Jobs (5 endpoints)**:
- `/api/cron/check-trials` - Trial expiration checks
- `/api/cron/check-payments` - Payment status checks
- `/api/cron/generate-bills` - Monthly bill generation
- `/api/cron/check-overdue-bills` - Overdue detection
- `/api/cron/process-renewals` - Subscription renewals

**Webhooks**:
- `/api/webhooks/hubtel` - Hubtel payment callback
- `/api/webhooks/stripe` - Stripe payment callback

## Environment Configuration

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis (Required for Socket.IO and caching)
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"

# Cron Jobs Security
CRON_SECRET="your-cron-secret-key"

# Hubtel Payment
HUBTEL_CLIENT_ID="your-client-id"
HUBTEL_CLIENT_SECRET="your-secret"
HUBTEL_MERCHANT_NUMBER="your-number"

# Stripe Payment (Optional)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SMS
SMS_PROVIDER="hubtel"
SMS_API_KEY="your-api-key"

# Storage
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="key"
AWS_SECRET_ACCESS_KEY="secret"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="radio-media"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Admin Contact
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PHONE="+233XXXXXXXXX"

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Ghana Market Context

### Payment Integration Priority
1. **Hubtel Mobile Money** (Primary)
   - MTN Mobile Money
   - Vodafone Cash
   - AirtelTigo Money
   - Most popular in Ghana

2. **Stripe** (Future - International)

### Pricing Strategy
- **Subscription**: GH₵500/month (affordable for local stations)
- **One-time**: GH₵9,000 (18-month equivalent)
- Initial considerations were higher, adjusted for market reality

### Target Audience Characteristics
- Traditional FM broadcasters (analog infrastructure)
- Limited existing digital tools
- Need for hybrid tracking (not just streaming analytics)
- Budget-conscious operations
- Growing digital adoption

## Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Database setup
npx prisma generate
npx prisma db push
npx prisma db seed  # (if seed file exists)

# Development
npm run dev          # Next.js dev server with Turbopack
npm run dev:socket   # Socket.io server (for live on-air)

# Production
npm run build
npm run start        # Next.js production server
npm run start:socket # Socket.IO production server

# Other
npm run lint         # ESLint checking
```

### Server Architecture
**Custom Server (`server.ts`)**:
- HTTP server on port 3000 (dev) / 3001 (production)
- Socket.IO integrated for real-time features
- Redis adapter for Socket.IO scalability
- Handles Next.js requests
- WebSocket channels for different features (onair, programs, clients)

**Two Server Modes**:
1. Next.js App (handles HTTP, API routes, SSR)
2. Socket.IO Server (handles WebSocket connections)

**Redis Channels**:
- `onair-updates` - Live on-air changes
- `program-updates` - Program schedule changes
- `client-updates` - Client data changes
- `queue-updates` - Queue management

### Git Workflow
- Main branch: `master`
- Feature branches: `feature/feature-name`
- Keep commits atomic and descriptive
- Recent commits show active development on admin features, billing, and listener tracking

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name description

# Apply in production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset
```

## Testing Considerations

**Multi-Tenancy Testing**:
- Always test with multiple organizations
- Verify data isolation between orgs
- Test cross-organization access denial

**Trial & Payment Testing**:
- Mock date to test trial expiration
- Use Hubtel test mode
- Test payment webhook handling

**SMS Testing**:
- Use mock gateway in development
- Verify SMS credit deduction
- Test delivery status tracking

**File Upload Testing**:
- Test storage limit enforcement
- Verify file access permissions
- Test large file handling

## Common Pitfalls to Avoid

1. ❌ Forgetting `organizationId` filter in queries
2. ❌ Not checking feature limits before creation
3. ❌ Not verifying feature flags before allowing access
4. ❌ Exposing other organization's data
5. ❌ Not validating payment webhook signatures
6. ❌ Hardcoding credentials in code
7. ❌ Missing trial expiration checks
8. ❌ Not implementing proper error boundaries
9. ❌ Ignoring file upload failure handling
10. ❌ Not protecting cron endpoints with CRON_SECRET
11. ❌ Missing Redis connection in Socket.IO setup

## Recent Development History

**Latest Commits** (Last 7):
1. **Enhanced Admin Page** (50079c1) - Feature activation, plan changes, payment creation
2. **P&L & 401 Fix** (6442d11) - Financial reporting and authentication fixes
3. **Listener Tracking** (417f8bd) - Operational reporting with correct data
4. **External Cron Jobs** (d5177c7) - Moved from Vercel to external service
5. **Production Configuration** (5f5e456) - WPA and production setup
6. **Next.js Upgrade** (56fb540) - Security vulnerability fixes
7. **Feature Locking** (8ec220a) - Admin-controlled feature access

**Current System Status**: ✅ Production-Ready
- Core modules fully functional
- Admin dashboard operational
- Billing system automated
- Feature locking implemented
- External cron jobs configured

**Current Focus**: Listener Tracking & AI Analytics Planning
- Phase 1: Hybrid listener engagement tracking
- Phase 2: AI-powered analytics and insights
- Designed for traditional FM stations (primary market)

## Key Project Files Reference

### Essential Documentation
- `CLAUDE_CODE_PROMPT.md` - Comprehensive development guide
- `TECHNICAL-SUMMARY.md` - Programs module implementation details
- `FOLDER_STRUCTURE.md` - Complete project structure
- `API_REFERENCE.md` - API endpoint documentation
- `DEVELOPMENT_CHECKLIST.md` - 250+ task checklist (16 phases)
- `BILLING_SYSTEM_GUIDE.md` - Subscription & payment flow
- `LIVE-ONAIR-USER-GUIDE.md` - WebSocket features guide

### Configuration Files
- `prisma/schema.prisma` - Database schema (50 models)
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variable template
- `next.config.ts` - Next.js configuration with Vercel settings
- `tailwind.config.ts` - Tailwind setup with custom animations
- `server.ts` - Custom HTTP + Socket.IO server
- `tsconfig.json` - TypeScript configuration

### State Management Files
- `store/auth.store.ts` - Authentication state
- `store/organization.store.ts` - Organization context
- `store/clients.store.ts` - Client list state
- `store/programs.store.ts` - Program management
- `store/ui.store.ts` - UI state (modals, sidebar)

### Validation Schemas (13 Total)
Located in `lib/validations/`:
- `account.validation.ts` - Profile updates
- `auth.validation.ts` - Login, registration
- `billing.validation.ts` - Payment forms
- `client.validation.ts` - Client CRUD
- `contract.validation.ts` - Contract forms
- `expense.validation.ts` - Expense tracking
- `invoice.validation.ts` - Invoice creation
- `organization.validation.ts` - Org settings
- `payment.validation.ts` - Payment processing
- `program.validation.ts` - Program management
- `sms.validation.ts` - SMS campaigns

### Email Templates
Located in `emails/`:
- `admin-overdue-summary.tsx` - Daily admin report
- `bill-reminder.tsx` - Upcoming bill notifications
- `overdue-bill.tsx` - Overdue payment reminders

## Developer Preferences

**Primary Stack**: TypeScript, JavaScript, Next.js, React, Node.js, Go, Python
**Code Style**: 
- TypeScript strict mode
- Functional components with hooks
- Server components where possible
- Zod for validation
- Clear error handling

**Development Approach**:
1. Documentation-first (diagrams, architecture)
2. Phase-based development
3. Multi-tenancy as core principle
4. Security-focused (data isolation)
5. Ghana market-specific solutions

## Next Steps Planning

### Immediate Priorities
1. **Listener Tracking Module**
   - Update Prisma schema with new models
   - Create API endpoints for tracking
   - Build dashboard components
   - Integrate with existing modules

2. **AI Analytics Integration**
   - Evaluate AI service options (OpenAI, Google Cloud, Hugging Face)
   - Implement sentiment analysis
   - Build analytics dashboard
   - Create recommendation engine

### Long-term Roadmap
- Expand payment options (Stripe)
- Mobile app companion (React Native)
- Advanced reporting features
- Multi-language support (English, Twi, Ga)
- Scale to handle more radio stations

## Important Notes for AI Assistants

**When working on this project**:
1. Always consider multi-tenant data isolation first
2. Verify organization ownership before any data operation
3. Check feature limits before creating resources
4. Use existing Prisma models and schemas
5. Follow Ghana-specific integration patterns (Hubtel priority)
6. Remember: Traditional FM stations are primary users
7. Maintain compatibility with hybrid tracking methods
8. Keep pricing context in mind (GH₵500/month target market)

**Code Generation Guidelines**:
- Use TypeScript strictly
- Implement proper error handling
- Add loading states for async operations
- Include permission checks in protected routes
- Follow existing project structure
- Use Shadcn/ui components
- Maintain consistency with existing code style

**Questions to Ask**:
- Does this need `organizationId` filtering?
- Is this feature locked? Check `enabledFeatures` array
- What happens when limit is reached?
- Is this user authorized for this action?
- How does this work for traditional FM stations?
- What's the error handling strategy?
- Does this respect multi-tenancy?
- Is Redis connection required for this feature?
- Should this emit a Socket.IO event for real-time updates?

## Subscription Plans Detail

### Starter Plan
- **Price**: GHS 500/month
- **Limits**: 5 users, 100 clients, 500 SMS/month, 5GB storage, 50 programs
- **Features**: Client management, Program scheduling, Invoices & Contracts, Expense tracking, Basic reports, Team management, On-Air dashboard

### Professional Plan (Most Popular)
- **Price**: GHS 1,200/month
- **Limits**: 15 users, 500 clients, 5,000 SMS/month, 50GB storage, 200 programs
- **Features**: Everything in Starter + SMS Campaigns, Ad management, Media library, WhatsApp integration, Advanced reports

### Enterprise Plan
- **Price**: Custom pricing
- **Limits**: 999 users, 9,999 clients, 99,999 SMS/month, 500GB storage, 9,999 programs
- **Features**: Everything in Professional + Unlimited users, Custom integrations, Dedicated account manager, Priority support

## PWA Configuration

**Capabilities**:
- Installable as desktop/mobile app
- Offline support via service worker
- App manifest for branding
- Push notifications (future)
- Configured via `next-pwa`

**Deployment**:
- Vercel deployment with custom server
- Prisma Accelerate for database optimization
- Redis via Upstash for caching and Socket.IO
- External cron job service for automated tasks

---

**Last Updated**: January 4, 2026  
**Project Status**: Active Development  
**Current Phase**: Planning Listener Tracking & AI Analytics Module
