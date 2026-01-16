# 📻 Radio Management System (RMS)

<div align="center">

![Radio Management System](https://img.shields.io/badge/Radio-Management-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**A comprehensive multi-tenant SaaS platform for managing traditional FM radio stations in Ghana**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Subscription Plans](#-subscription-plans)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

---

## 🎯 Overview

**Radio Management System (RMS)** is a modern, cloud-based platform designed specifically for traditional FM radio broadcasters in Ghana. It provides a comprehensive suite of tools to manage programs, clients, finances, advertising campaigns, SMS marketing, live on-air operations, and streaming services.

### 🌟 Why RMS?

- **Built for Ghana**: Integrated with Ghanaian payment systems (Hubtel, Paystack) and mobile money
- **Multi-Tenant**: Secure isolation between radio stations with organization-level data segregation
- **Affordable**: Plans starting from GHS 500/month with 7-day free trial
- **Real-Time**: WebSocket-powered live on-air dashboard with instant updates
- **Complete Solution**: From scheduling to billing, everything a radio station needs

---

## ✨ Key Features

### 🎙️ Core Operations

#### ✅ Program Management
- Create and manage radio programs/shows
- Schedule programs with day and time slots
- Episode tracking and management
- Host assignment and permissions
- Calendar view of program schedules
- **Status**: Production-ready ✅

#### ✅ Client & Financial Management
- Client/advertiser database with detailed profiles
- Contract creation and management
- Invoice generation with PDF export
- Expense tracking and categorization
- Bill management and payment tracking
- Financial reporting (P&L, Revenue, Aging Analysis)
- **Status**: Production-ready ✅

#### ✅ Live On-Air Dashboard
- Real-time "Now Playing" display
- Queue management for upcoming content
- Instant audio triggers
- Listener request handling
- Song library and search
- Playlist management
- Play history tracking
- **Status**: Production-ready ✅
- **Technology**: Socket.IO + Redis for real-time updates

#### ✅ SMS Campaigns
- Bulk SMS messaging system
- Campaign creation and management
- Template system for recurring messages
- Credit-based billing system
- Monthly allocation with rollover
- Delivery tracking and analytics
- **Integration**: Hubtel SMS API / Africa's Talking
- **Status**: Production-ready ✅

#### ✅ Advertisement Management
- Ad campaign creation and scheduling
- Multiple ad types (audio, jingles, sponsorships)
- Campaign performance tracking
- Revenue attribution
- Client-linked campaigns
- **Status**: Production-ready ✅

#### ✅ Media Library
- Audio file storage and management
- Jingle library
- Episode audio uploads
- File organization by type
- Storage limit enforcement
- **Storage**: AWS S3 / Cloudinary integration
- **Status**: Production-ready ✅

#### ✅ Streaming Integration
- AzuraCast integration for internet streaming
- Media upload to streaming server
- Storage limit enforcement for streaming files
- Playlist management
- **Status**: Production-ready ✅

#### ✅ Team Management
- User invitation system
- Role-based access control (RBAC)
- 6 predefined roles (Owner, Admin, Program Manager, Sales Manager, Host, Viewer)
- Granular permissions system
- Team member management
- **Status**: Production-ready ✅

#### ✅ Reports & Analytics
- Dashboard with key metrics
- Revenue reports
- SMS usage analytics
- Client analytics
- Program analytics
- Contract analysis
- Invoice aging analysis
- P&L statements
- **Status**: Production-ready ✅

#### ✅ Subscription & Billing System
- Automated monthly billing
- Paystack payment integration
- Mobile Money support (MTN, Vodafone, AirtelTigo)
- Subscription invoices and receipts
- Trial period management (7 days)
- Plan upgrades/downgrades
- Payment webhooks
- Overdue payment tracking
- **Status**: Production-ready ✅

#### ✅ Admin Dashboard (Super User)
- Organization management
- Feature activation/deactivation per organization
- Plan upgrades and downgrades
- Payment creation and tracking
- Revenue analytics across all organizations
- Trial period management
- Organization status control
- **Status**: Production-ready ✅

#### ✅ Automated Background Jobs
- Trial expiration checking
- Payment status verification
- Monthly bill generation
- Overdue bill detection and alerts
- Subscription renewal processing
- **Technology**: External cron service (Render, Railway, or custom)
- **Status**: Production-ready ✅

### 🚧 Features In Development

#### 🔄 Enhanced Listener Tracking (Phase 1 - In Planning)
Traditional FM radio stations need hybrid tracking methods that don't rely solely on streaming analytics:

- **Call-in Tracking**: Monitor and log listener phone calls
- **SMS Request Analysis**: Track song requests via SMS
- **WhatsApp Integration**: Monitor WhatsApp interactions
- **Contest Participation**: Track contest entries and engagement
- **Social Media Monitoring**: Track mentions and interactions
- **Web/App Streaming**: Optional streaming analytics for digital listeners

**Target Completion**: Q2 2026

#### 🤖 AI-Powered Analytics (Phase 2 - Future)
Advanced analytics using artificial intelligence:

- **Sentiment Analysis**: Analyze SMS, WhatsApp, and social media sentiment
- **Program Performance Prediction**: ML-based show performance forecasting
- **Optimal Scheduling**: AI recommendations for best program time slots
- **Demographic Insights**: Listener demographic analysis
- **Content Analysis**: Topic extraction from listener interactions
- **Engagement Trends**: Pattern recognition in listener behavior
- **Ad Performance Optimization**: AI-driven ad placement recommendations

**Target Completion**: Q4 2026

**AI Service Options**:
- OpenAI GPT-4 API
- Google Cloud Natural Language API
- Hugging Face Models
- Custom TensorFlow models

### 🎨 Planned Features

#### Mobile Application
- React Native companion app
- iOS and Android support
- Push notifications
- Offline mode for critical features
- Mobile-optimized UI

#### Advanced Features
- **Multi-Language Support**: English, Twi, Ga, and other Ghanaian languages
- **Voice Recording**: In-app audio recording for episodes
- **Live Streaming**: Built-in streaming without external services
- **Podcast Publishing**: Automated podcast distribution
- **Sponsor Management**: Dedicated sponsor portal
- **Ad Inventory Management**: Real-time ad slot availability
- **Automated Contracts**: Contract generation from templates
- **WhatsApp Business API**: Direct WhatsApp campaigns
- **Payment Plans**: Installment payment options for clients
- **Multi-Station Groups**: Manage multiple stations under one account

#### Integrations
- Stripe (for international payments)
- Google Analytics integration
- Facebook & Instagram API
- Twitter API for social monitoring
- Calendly for guest scheduling
- Zapier integration for automation

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 19+
- **Styling**: TailwindCSS
- **Components**: Shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PWA**: next-pwa

### Backend
- **Framework**: Next.js API Routes + Server Actions
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 6+
- **Authentication**: NextAuth.js v5
- **Real-Time**: Socket.IO with Redis adapter
- **Queue**: BullMQ with Redis
- **File Storage**: AWS S3 / Cloudinary
- **Email**: Resend API
- **SMS**: Hubtel / Africa's Talking
- **Payments**: Paystack (Primary), Hubtel Mobile Money

### Infrastructure
- **Hosting**: Vercel / Self-hosted
- **Database**: Neon / Supabase / Self-hosted PostgreSQL
- **Cache/Real-Time**: Redis (Upstash / Self-hosted)
- **File Storage**: AWS S3 / Cloudinary
- **CDN**: Vercel Edge / CloudFlare
- **Monitoring**: Sentry (optional)

### Development Tools
- **Package Manager**: npm / pnpm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Git Hooks**: Husky
- **API Testing**: Postman / Thunder Client

---

## 🏗 Architecture

### Multi-Tenant Strategy
**Row-Level Multi-Tenancy**: Every business data model includes an `organizationId` field for data isolation.

```typescript
// Example: All queries MUST filter by organizationId
const clients = await prisma.client.findMany({
  where: { organizationId: session.user.organizationId }
})
```

### Database Models (50+ Tables)
- **Core**: Organization, User, Role, Permission, Team
- **Subscription**: Subscription, SubscriptionPlan, SubscriptionPayment
- **Operations**: Program, Episode, Client, Contract, Invoice
- **Marketing**: SMSCampaign, SMSMessage, AdCampaign, Advertisement
- **Media**: MediaFile, Song, Playlist, InstantAudio
- **Live**: OnAirNow, OnAirQueue, ListenerRequest
- **Analytics**: ListenerSession, ListenerMetrics, ProgramRating
- **Communication**: WhatsAppAccount, WhatsAppMessage, Communication
- **System**: ActivityLog, Metric, Bill

### Security Features
- **Data Isolation**: Organization-level data segregation
- **Role-Based Access**: Granular permissions system
- **Authentication**: Secure session management with NextAuth
- **API Protection**: Middleware validation on all routes
- **Webhook Verification**: Signature verification for payment webhooks
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: React's built-in escaping + sanitization
- **CSRF Protection**: NextAuth CSRF tokens

---

## 📦 Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **npm/pnpm**: Latest version
- **PostgreSQL**: v14+ (or use hosted service)
- **Redis**: v6+ (or use Upstash)
- **Git**: Latest version

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/radio-management-system.git
cd radio-management-system
```

### Step 2: Install Dependencies
```bash
npm install
# or
pnpm install
```

### Step 3: Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#-configuration) section).

### Step 4: Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# OR run migrations (production)
npx prisma migrate deploy

# Seed subscription plans
npx tsx scripts/seed-subscription-plans.ts
```

### Step 5: Run Development Server
```bash
# Start Next.js development server
npm run dev

# In another terminal, start Socket.IO server
npm run dev:socket
```

The application will be available at:
- **Frontend/API**: http://localhost:3000
- **Socket.IO**: http://localhost:3001

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# App Configuration
NODE_ENV=development
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rms_db

# Redis (Required for Socket.IO and caching)
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Cron Jobs Security
CRON_SECRET=your-cron-secret-key

# Paystack Payment
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Hubtel Mobile Money (Optional)
HUBTEL_CLIENT_ID=your-client-id
HUBTEL_CLIENT_SECRET=your-secret
HUBTEL_MERCHANT_NUMBER=your-number

# Stripe (Optional - for international payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# SMS Provider (Choose one)
SMS_PROVIDER=hubtel
# Hubtel SMS
HUBTEL_SMS_API_KEY=your-api-key
# OR Africa's Talking
AFRICAS_TALKING_API_KEY=your-api-key
AFRICAS_TALKING_USERNAME=your-username

# File Storage (Choose one)
STORAGE_PROVIDER=s3
# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=radio-media
# OR Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Admin Contact
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+233XXXXXXXXX

# AzuraCast Streaming (Optional)
AZURACAST_API_URL=https://your-azuracast.com
AZURACAST_API_KEY=your-api-key

# Optional Services
SENTRY_DSN=https://xxx@sentry.io/xxx
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Generating Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

---

## 🚀 Usage

### User Registration

1. Visit `http://localhost:3000/register`
2. Fill in organization details
3. Automatic 7-day trial activation with full features
4. Access dashboard immediately

### Admin Access

**Super Admin Account** (for managing all organizations):
- Create first organization through normal registration
- Manually update role in database:
```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'admin@example.com';
```
- Access admin dashboard at `/admin`

### Payment Testing

**Paystack Test Mode**:
- Test card: `4084084084084081`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `123456`

**Mobile Money Test**:
- Use test merchant credentials from Paystack/Hubtel

### Cron Jobs Setup

The system requires external cron jobs for automated tasks. Set up using any cron service:

**Endpoints to hit daily**:
```bash
# Check trial expirations (daily at 00:00)
curl -X POST https://your-domain.com/api/cron/check-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check payment statuses (daily at 01:00)
curl -X POST https://your-domain.com/api/cron/check-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Generate monthly bills (1st of month at 00:00)
curl -X POST https://your-domain.com/api/cron/generate-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check overdue bills (daily at 08:00)
curl -X POST https://your-domain.com/api/cron/check-overdue-bills \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Process renewals (daily at 02:00)
curl -X POST https://your-domain.com/api/cron/process-renewals \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Services to use**:
- [Render Cron Jobs](https://render.com)
- [Railway Cron Jobs](https://railway.app)
- [EasyCron](https://www.easycron.com)
- Self-hosted cron

---

## 📁 Project Structure

```
radio-management-system/
├── app/
│   ├── (admin)/              # Admin dashboard pages
│   │   └── admin/
│   │       ├── organizations/
│   │       ├── payments/
│   │       └── revenue/
│   ├── (auth)/               # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── error/
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── programs/         # Program management
│   │   ├── clients/          # Client management
│   │   ├── contracts/        # Contracts
│   │   ├── invoices/         # Invoicing
│   │   ├── expenses/         # Expenses
│   │   ├── sms/              # SMS campaigns
│   │   ├── ads/              # Advertisements
│   │   ├── onair/            # Live on-air dashboard
│   │   ├── media/            # Media library
│   │   ├── streaming/        # Streaming management
│   │   ├── reports/          # Reports & analytics
│   │   ├── teams/            # Team management
│   │   ├── settings/         # Organization settings
│   │   └── upgrade/          # Subscription upgrade
│   ├── (public)/             # Public pages
│   │   └── book/             # Airtime booking
│   ├── api/                  # API routes (59 endpoints)
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── programs/
│   │   ├── clients/
│   │   ├── contracts/
│   │   ├── invoices/
│   │   ├── expenses/
│   │   ├── sms/
│   │   ├── ads/
│   │   ├── onair/
│   │   ├── streaming/
│   │   ├── reports/
│   │   ├── subscription/
│   │   ├── cron/
│   │   ├── webhooks/
│   │   └── uploadthing/
│   └── actions/              # Server actions
├── components/
│   ├── ui/                   # Shadcn/ui components
│   ├── layouts/              # Layout components
│   ├── dashboard/            # Dashboard components
│   └── [features]/           # Feature-specific components
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client
│   ├── redis.ts              # Redis client
│   ├── validations/          # Zod validation schemas
│   ├── services/             # Business logic services
│   │   ├── limit-enforcement.ts
│   │   ├── sms-credits.ts
│   │   ├── azuracast.service.ts
│   │   └── ...
│   ├── integrations/         # External service integrations
│   │   ├── paystack.ts
│   │   ├── hubtel.ts
│   │   └── ...
│   ├── pdf-generator.ts      # PDF generation
│   ├── features.ts           # Feature flag system
│   └── permissions.ts        # RBAC helpers
├── hooks/                    # Custom React hooks
├── store/                    # Zustand state management
│   ├── auth.store.ts
│   ├── organization.store.ts
│   ├── clients.store.ts
│   └── programs.store.ts
├── types/                    # TypeScript type definitions
├── config/                   # Configuration files
│   ├── site.ts
│   ├── navigation.ts
│   └── permissions.ts
├── emails/                   # Email templates
│   ├── bill-reminder.tsx
│   ├── overdue-bill.tsx
│   └── admin-overdue-summary.tsx
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/
├── scripts/
│   └── seed-subscription-plans.ts
├── docs/                     # Documentation
│   ├── TECHNICAL-SUMMARY.md
│   ├── LIMIT_ENFORCEMENT_STATUS.md
│   └── ...
├── public/                   # Static assets
├── server.ts                 # Custom Socket.IO server
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

---

## 💳 Subscription Plans

### Starter Plan - GHS 500/month
**Ideal for small radio stations getting started**

- ✅ 5 Users
- ✅ 100 Clients
- ✅ 500 SMS/month
- ✅ 5GB Storage
- ✅ 50 Programs
- ✅ Client Management
- ✅ Program Scheduling
- ✅ Invoices & Contracts
- ✅ Expense Tracking
- ✅ Basic Reports
- ✅ Team Management
- ✅ On-Air Dashboard

### Professional Plan - GHS 1,200/month ⭐
**Most Popular - For growing stations with advanced needs**

Everything in Starter, plus:
- ✅ 15 Users
- ✅ 500 Clients
- ✅ 5,000 SMS/month
- ✅ 50GB Storage
- ✅ 200 Programs
- ✅ SMS Campaigns
- ✅ Ad Management
- ✅ Media Library
- ✅ WhatsApp Integration
- ✅ Advanced Reports
- ✅ Revenue Analytics
- ✅ Contract Analysis

### Enterprise Plan - GHS 2,500/month
**For large stations with custom requirements**

Everything in Professional, plus:
- ✅ 999 Users
- ✅ 9,999 Clients
- ✅ 99,999 SMS/month
- ✅ 500GB Storage
- ✅ 9,999 Programs
- ✅ Custom Integrations
- ✅ Dedicated Account Manager
- ✅ Priority Support
- ✅ Custom Features
- ✅ API Access

### 🆓 7-Day Free Trial
All new organizations get **7 days of full access** to all Enterprise features.

---

## 📚 API Documentation

### Base URL
```
https://your-domain.com/api
```

### Authentication
All API endpoints (except webhooks) require authentication via NextAuth session cookies.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login (handled by NextAuth)
- `GET /api/auth/session` - Get current session

#### Programs
- `GET /api/programs` - List all programs
- `POST /api/programs` - Create program
- `GET /api/programs/[id]` - Get program details
- `PUT /api/programs/[id]` - Update program
- `DELETE /api/programs/[id]` - Delete program

#### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

#### On-Air
- `GET /api/onair/now` - Get current playing item
- `POST /api/onair/now` - Set current playing item
- `GET /api/onair/queue` - Get queue
- `POST /api/onair/queue` - Add to queue
- `POST /api/onair/program/start` - Start program

#### Subscription
- `GET /api/subscription/plans` - List available plans
- `POST /api/subscription/subscribe` - Subscribe to plan
- `POST /api/subscription/upgrade` - Upgrade/downgrade plan

#### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/financial/revenue` - Revenue report
- `GET /api/reports/clients` - Client analytics
- `GET /api/reports/programs` - Program analytics

**Full API documentation**: See `docs/API_REFERENCE.md`

---

## 🔧 Development

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix linting errors
npm run lint:fix
```

### Database Management
```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Create migration
npx prisma migrate dev --name description

# Reset database (CAUTION!)
npx prisma migrate reset
```

### Code Generation
```bash
# Generate Prisma Client
npx prisma generate

# Generate types from API
npm run generate:types
```

---

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Visit [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your repository

3. **Configure Environment Variables**
- Add all production environment variables
- Set `NODE_ENV=production`

4. **Deploy**
- Vercel will automatically deploy
- Custom domain setup available

5. **Socket.IO Server**
- Deploy `server.ts` to a separate service (Render, Railway, Fly.io)
- Update `NEXT_PUBLIC_SOCKET_URL` environment variable

### Self-Hosted Deployment

#### Prerequisites
- Ubuntu 20.04+ server
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Nginx
- PM2 or systemd

#### Steps

1. **Clone and Install**
```bash
git clone https://github.com/your-org/radio-management-system.git
cd radio-management-system
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with production values
```

3. **Build Application**
```bash
npm run build
```

4. **Start with PM2**
```bash
# Install PM2
npm install -g pm2

# Start Next.js app
pm2 start npm --name "rms-web" -- start

# Start Socket.IO server
pm2 start npm --name "rms-socket" -- run start:socket

# Save PM2 configuration
pm2 save
pm2 startup
```

5. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

6. **SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com
```

### Database Backup
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for all new code
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Multi-Tenancy Rules ⚠️
**CRITICAL**: Always filter by `organizationId` in database queries
```typescript
// ❌ BAD - Security vulnerability!
const clients = await prisma.client.findMany()

// ✅ GOOD - Properly isolated
const clients = await prisma.client.findMany({
  where: { organizationId: session.user.organizationId }
})
```

### Pull Request Process
1. Update the README.md with details of changes
2. Update the documentation if needed
3. Increase version numbers following [SemVer](https://semver.org/)
4. PR will be merged after review

---

## 📞 Support

### Documentation
- **Technical Guide**: `docs/TECHNICAL-SUMMARY.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Development Checklist**: `docs/DEVELOPMENT_CHECKLIST.md`
- **Billing Guide**: `docs/BILLING_SYSTEM_GUIDE.md`
- **Limit Enforcement**: `docs/LIMIT_ENFORCEMENT_STATUS.md`

### Contact
- **Email**: support@radio.edtmsys.com
- **Phone**: +233 XX XXX XXXX
- **Website**: https://radio.edtmsys.com

### Bug Reports
Please open an issue on GitHub with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

### Feature Requests
Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Proposed solution (if any)
- Relevant examples

---

## 📄 License

**Proprietary License**

Copyright © 2026 Radio Management System

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

For licensing inquiries, contact: licensing@radio.edtmsys.com

---

## 🙏 Acknowledgments

### Built With
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Socket.IO](https://socket.io/) - Real-time engine
- [Paystack](https://paystack.com/) - Payment processing

### Special Thanks
- Ghana Radio Broadcasting Community
- Early beta testers
- Open source contributors

---

## 🚀 Roadmap

### Q1 2026 ✅ (Completed)
- [x] Core program management
- [x] Client & financial management
- [x] Live on-air dashboard
- [x] SMS campaigns
- [x] Subscription billing
- [x] Admin dashboard
- [x] Automated billing jobs
- [x] Streaming integration
- [x] Limit enforcement
- [x] Plan upgrade/downgrade system

### Q2 2026 🔄 (In Progress)
- [ ] Enhanced listener tracking (hybrid model)
- [ ] WhatsApp Business API integration
- [ ] Mobile app (React Native) - Phase 1
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Twi, Ga)

### Q3 2026 📋 (Planned)
- [ ] AI-powered analytics
- [ ] Sentiment analysis
- [ ] Program performance prediction
- [ ] Voice recording features
- [ ] Automated contract generation

### Q4 2026 🎯 (Future)
- [ ] Multi-station management
- [ ] Podcast publishing automation
- [ ] Advanced sponsorship portal
- [ ] International expansion (Stripe)
- [ ] Open API for third-party integrations

---

<div align="center">

**Made with ❤️ for Ghana's Radio Broadcasting Community**

[⬆ Back to Top](#-radio-management-system-rms)

</div>
