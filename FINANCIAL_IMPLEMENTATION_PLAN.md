# Financial Reports & Analytics Implementation Plan

## Overview
This document outlines the implementation plan for a comprehensive financial reporting system including Profit & Loss (P&L), Revenue Reports, Invoice Management, Contract Tracking, and Ad Campaign ROI Analytics.

---

## 1. VALIDATION SCHEMAS

### Files to Create:
- `lib/validations/invoice.ts`
- `lib/validations/contract.ts`
- `lib/validations/payment.ts`
- `lib/validations/adcampaign.ts`


### Schema Structure:

#### Invoice Schema
```typescript
// Create Invoice
createInvoiceSchema = {
  clientId: string (required)
  contractId?: string (optional)
  issueDate: Date (required)
  dueDate: Date (required)
  subtotal: Decimal (required)
  taxAmount?: Decimal (optional)
  discount?: Decimal (optional)
  notes?: string (optional)
  items: Array<{
    description: string
    quantity: number
    unitPrice: Decimal
  }> (required)
}

// Update Invoice
updateInvoiceSchema = createInvoiceSchema + {
  status: InvoiceStatus (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
}
```

#### Contract Schema
```typescript
// Create Contract
createContractSchema = {
  contractNumber: string (required, unique per org)
  clientId: string (required)
  title: string (required)
  description?: string (optional)
  startDate: Date (required)
  endDate: Date (required)
  value: Decimal (required)
  terms?: string (optional)
  documentUrl?: string (optional)
}

// Update Contract
updateContractSchema = createContractSchema + {
  status: ContractStatus (DRAFT, PENDING, ACTIVE, EXPIRED, TERMINATED)
  signedAt?: Date (optional)
}
```

#### Payment Schema
```typescript
recordPaymentSchema = {
  invoiceId: string (required)
  amount: Decimal (required)
  paymentDate: Date (required)
  paymentMethod: PaymentMethod (CASH, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, CARD, OTHER)
  referenceNumber?: string (optional)
  notes?: string (optional)
}
```

#### Ad Campaign Schema
```typescript
createAdCampaignSchema = {
  name: string (required)
  description?: string (optional)
  clientId: string (required)
  startDate: Date (required)
  endDate: Date (required)
  budget?: Decimal (optional)
}

// Update with tracking
updateAdCampaignSchema = createAdCampaignSchema + {
  status: AdCampaignStatus (PENDING, ACTIVE, PAUSED, COMPLETED, CANCELLED)
  actualSpent?: Decimal (optional)
}
```

---

## 2. API ENDPOINTS

### Invoice API Routes
**Location:** `app/api/invoices/route.ts` and `app/api/invoices/[id]/route.ts`

#### Endpoints:

```
GET /api/invoices
- Query: ?page=1&pageSize=10&status=PAID&clientId=xxx&startDate=2024-01-01&endDate=2024-12-31&search=xxx
- Response: { data: Invoice[], pagination: { total, page, pageSize, totalPages }, summary: { totalAmount, paidAmount, overdueAmount } }

POST /api/invoices
- Body: createInvoiceSchema
- Response: { data: Invoice, message: "Invoice created" }

GET /api/invoices/:id
- Response: { data: Invoice with items and payments }

PUT /api/invoices/:id
- Body: updateInvoiceSchema
- Response: { data: Invoice, message: "Invoice updated" }

DELETE /api/invoices/:id
- Response: { message: "Invoice deleted" }

POST /api/invoices/:id/payments
- Body: recordPaymentSchema
- Response: { data: Payment, invoice: Invoice (updated) }

GET /api/invoices/:id/payments
- Response: { data: Payment[], summary: { totalPaid, remainingBalance } }
```

### Contract API Routes
**Location:** `app/api/contracts/route.ts` and `app/api/contracts/[id]/route.ts`

#### Endpoints:

```
GET /api/contracts
- Query: ?page=1&pageSize=10&status=ACTIVE&clientId=xxx&search=xxx
- Response: { data: Contract[], pagination, summary: { totalValue, activeValue, completedValue } }

POST /api/contracts
- Body: createContractSchema
- Response: { data: Contract, message: "Contract created" }

GET /api/contracts/:id
- Response: { data: Contract with related invoices }

PUT /api/contracts/:id
- Body: updateContractSchema
- Response: { data: Contract, message: "Contract updated" }

DELETE /api/contracts/:id
- Response: { message: "Contract deleted" }
```

### Financial Metrics API
**Location:** `app/api/reports/financial/route.ts`

#### Endpoints:

```
GET /api/reports/financial/summary
- Query: ?startDate=2024-01-01&endDate=2024-12-31
- Response: {
    period: { startDate, endDate },
    revenue: { invoices: total, contracts: total, adCampaigns: budgeted },
    expenses: { operationalCosts, adSpending, otherExpenses },
    profit: { gross, net },
    paymentStatus: { paid, pending, overdue },
    metrics: { revenueGrowth%, profitMargin%, collectionRate% }
  }

GET /api/reports/financial/pl
- Query: ?startDate=2024-01-01&endDate=2024-12-31&groupBy=month|quarter|year
- Response: {
    period: TimeRange,
    revenue: { invoice_revenue, contract_revenue, service_revenue, other_revenue, total },
    expenses: { salary, equipment, marketing, utilities, other, total },
    profit: { gross_profit, operating_profit, net_profit },
    margins: { gross_margin%, operating_margin%, net_margin% },
    breakdown: [{ period, revenue, expenses, profit, margins }]
  }

GET /api/reports/financial/revenue
- Query: ?startDate=2024-01-01&endDate=2024-12-31&groupBy=client|category|source
- Response: {
    period: TimeRange,
    totalRevenue: Decimal,
    bySource: [{ source, amount, percentage, growth }],
    topClients: [{ clientName, revenue, invoiceCount, averageInvoiceValue }],
    trend: [{ date, revenue, cumulativeRevenue }]
  }

GET /api/reports/financial/invoices/aging
- Query: ?date=2024-12-31
- Response: {
    current: { count, amount },
    30days: { count, amount },
    60days: { count, amount },
    90days: { count, amount },
    over90: { count, amount },
    total: { count, amount }
  }

GET /api/reports/financial/ad-campaigns/roi
- Query: ?startDate=2024-01-01&endDate=2024-12-31
- Response: {
    campaigns: [{
      id, name, client, budget, actualSpent, roi%, status,
      impressions, clicks, conversions, cpc, cpm, conversionRate
    }],
    summary: { totalBudget, totalSpent, totalROI%, averageROI% }
  }

GET /api/reports/financial/cash-flow
- Query: ?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
- Response: {
    period: TimeRange,
    inflows: [{ date, invoicePayments, contractPayments, otherInflows, total }],
    outflows: [{ date, expenses, salaries, other, total }],
    netCashFlow: [{ date, net, cumulative }]
  }
```

---

## 3. SERVER ACTIONS

**Location:** `app/actions/financial.ts`

### Functions:

```typescript
// Invoice Actions
export async function fetchInvoices(params): Promise<InvoiceResponse>
export async function createInvoice(data): Promise<Invoice>
export async function updateInvoice(id, data): Promise<Invoice>
export async function deleteInvoice(id): Promise<{ success: boolean }>
export async function recordPayment(invoiceId, paymentData): Promise<Payment>
export async function getInvoiceDetails(id): Promise<InvoiceWithDetails>

// Contract Actions
export async function fetchContracts(params): Promise<ContractResponse>
export async function createContract(data): Promise<Contract>
export async function updateContract(id, data): Promise<Contract>
export async function deleteContract(id): Promise<{ success: boolean }>
export async function getContractDetails(id): Promise<ContractWithRelations>

// Financial Reports
export async function fetchFinancialSummary(startDate, endDate): Promise<FinancialSummary>
export async function fetchPLReport(startDate, endDate, groupBy): Promise<PLReport>
export async function fetchRevenueReport(startDate, endDate, groupBy): Promise<RevenueReport>
export async function fetchInvoiceAging(asOfDate): Promise<InvoiceAgingReport>
export async function fetchAdCampaignROI(startDate, endDate): Promise<AdROIReport>
export async function fetchCashFlowReport(startDate, endDate, groupBy): Promise<CashFlowReport>
```

---

## 4. UI PAGES & COMPONENTS

### Invoice Management
**Location:** `app/(dashboard)/invoices/`

#### Pages:
1. **`page.tsx`** - Invoice List
   - Table with columns: Invoice#, Client, Amount, Status, Due Date, Paid Date
   - Filters: Status, Client, Date Range, Amount Range
   - Actions: Create, Edit, Delete, View, Record Payment, Email
   - Summary Cards: Total Invoices, Total Amount, Amount Paid, Outstanding
   - Quick Stats: Overdue Invoices, This Month Revenue

2. **`new/page.tsx`** - Create Invoice
   - Form with: Client Select, Contract Select, Issue Date, Due Date
   - Line Items: Dynamic table with Add/Remove buttons
   - Item Columns: Description, Quantity, Unit Price, Amount (auto-calculated)
   - Subtotal, Tax Amount, Discount, Total Amount (all auto-calculated)
   - Notes field
   - Save as Draft / Send / Save & Email

3. **`[id]/page.tsx`** - Invoice Details & Edit
   - Display invoice with all details
   - Edit mode for draft invoices
   - Payment history table
   - Record payment button
   - Status badge and actions (Send, Email, Mark Paid, Cancel)
   - PDF export option
   - Timeline of changes

### Contract Management
**Location:** `app/(dashboard)/contracts/`

#### Pages:
1. **`page.tsx`** - Contract List
   - Table with columns: Contract#, Client, Value, Status, Start Date, End Date, Signed Date
   - Filters: Status, Client, Value Range, Active/Expired
   - Actions: Create, Edit, Delete, View, Manage
   - Summary Cards: Total Contracts, Total Value, Active Contracts Value, Revenue Recognition
   - Related Invoices count per contract

2. **`new/page.tsx`** - Create Contract
   - Form with: Contract Number (auto or manual), Client, Title, Description
   - Duration: Start Date, End Date, Auto-renew option
   - Financial: Value, Payment Terms, Conditions
   - Document upload for contract file
   - Terms textarea
   - Save as Draft / Send for Review

3. **`[id]/page.tsx`** - Contract Details
   - Display contract with all details
   - Status timeline (Draft → Pending → Active → Expired/Terminated)
   - Related invoices list (created from this contract)
   - Financial summary (value, invoiced, remaining, received)
   - Document download
   - Edit button (for draft contracts)
   - Sign contract option with signature capture
   - Renewal/Extension option

### Financial Reports
**Location:** `app/(dashboard)/reports/financial/`

#### Pages:

1. **`page.tsx`** - Financial Reports Dashboard
   - Quick summary cards: Total Revenue, Total Expenses, Net Profit, Profit Margin
   - KPIs: Cash on Hand, Days Sales Outstanding, Collection Rate
   - Report selector/navigation (P&L, Revenue, Invoice Aging, Ad ROI, Cash Flow)
   - Charts: Revenue Trend, Expense Breakdown, Monthly P&L

2. **`pl/page.tsx`** - Profit & Loss Report
   - Period selector (Month, Quarter, Year, Custom Range)
   - Group by option (Month, Quarter, Year)
   - Revenue Section:
     - Invoice Revenue (by month)
     - Contract Revenue (recognized)
     - Service Revenue
     - Other Revenue
     - Total Revenue
   - Expenses Section:
     - Cost of Goods Sold (if applicable)
     - Operating Expenses:
       - Salary & Wages
       - Rent & Utilities
       - Marketing & Advertising
       - Equipment & Depreciation
       - Software & Subscriptions
       - Other Operating Expenses
     - Total Operating Expenses
   - Profit Calculations:
     - Gross Profit
     - Operating Profit
     - Net Profit
   - Margins:
     - Gross Profit Margin %
     - Operating Profit Margin %
     - Net Profit Margin %
   - Table view with breakdown by period
   - Charts: Revenue vs Expenses, Profit Trend, Expense Breakdown
   - Export to PDF/Excel

3. **`revenue/page.tsx`** - Revenue Report
   - Period selector
   - Group by option: Client, Category, Source, Product
   - Total Revenue with comparison to previous period
   - Revenue by dimension (table + charts):
     - Client breakdown with trends
     - Category breakdown
     - Source breakdown
   - Top Clients section
   - Revenue Trend chart (line or area)
   - Monthly Comparison
   - Export options

4. **`invoices/aging/page.tsx`** - Invoice Aging Report
   - Aging buckets: Current, 30 days, 60 days, 90 days, Over 90 days
   - Table for each bucket showing: Invoice#, Client, Amount, Days Overdue, Contact
   - Summary by bucket: Count, Total Amount, Percentage of AR
   - Total Accounts Receivable
   - Collection actions: Email reminder, SMS notification
   - Highlight overdue invoices (90+ days in red)
   - DSO (Days Sales Outstanding) metric

5. **`ad-campaigns/roi/page.tsx`** - Ad Campaign ROI Analytics
   - Campaign list with columns: Name, Client, Budget, Actual Spend, ROI %, Status
   - Filters: Date Range, Client, ROI Range, Status
   - Summary metrics: Total Budget, Total Spend, Average ROI %, Campaigns with Positive ROI
   - Detailed view per campaign:
     - Budget vs Actual Spend chart
     - ROI breakdown
     - Performance metrics (if tracked): Impressions, Clicks, Conversions, CPC, CPM
   - Comparison: This period vs last period
   - Recommendations based on ROI

6. **`cash-flow/page.tsx`** - Cash Flow Report
   - Period selector with grouping (Monthly, Quarterly)
   - Cash Inflows:
     - Invoice Payments Received
     - Contract Payments
     - Other Income
     - Total Inflows
   - Cash Outflows:
     - Operating Expenses
     - Salaries
     - Debt Payments
     - Capital Expenditures
     - Total Outflows
   - Net Cash Flow (Inflows - Outflows)
   - Cumulative Cash Flow
   - Cash Position over time
   - Charts: Waterfall chart, Cash Balance Trend
   - Forecast (if data available)

---

## 5. DATABASE ENHANCEMENTS

### New Fields to Add (Optional Extensions)

#### Invoice Model Enhancement
```
Add to Invoice:
- paymentTerms: string (NET30, NET60, etc)
- reminderSent: DateTime (track last reminder)
- category: string (Service, Product, Retainer, etc)
```

#### Contract Model Enhancement
```
Add to Contract:
- paymentSchedule: JSON (for milestone-based payments)
- autoRenewal: Boolean
- renewalTerm: Int (days)
- marginTarget: Decimal
- revenueRecognitionMethod: string (upfront, milestone, monthly)
```

#### New Model: ExpenseCategory
```
model ExpenseCategory {
  id: String @id @default(cuid())
  organizationId: String
  name: String
  description: String?
  type: ExpenseType (OPERATIONAL, COGS, CAPITAL, etc)
  expenses: Expense[]
  createdAt: DateTime @default(now())
}
```

#### New Model: Expense (Optional - for comprehensive P&L)
```
model Expense {
  id: String @id @default(cuid())
  organizationId: String
  categoryId: String
  amount: Decimal
  description: String
  date: DateTime
  vendor: String
  referenceNumber: String?
  attachments: String? (JSON URLs)
  createdAt: DateTime @default(now())
}
```

---

## 6. IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1-2)
- [ ] Create validation schemas for Invoice, Contract, Payment
- [ ] Create Invoice API endpoints (GET, POST, PUT, DELETE)
- [ ] Create server actions for invoice operations
- [ ] Create Invoice Management UI page (list)

### Phase 2: Invoice Management (Week 2-3)
- [ ] Create invoice create/edit pages
- [ ] Create payment recording functionality
- [ ] Create invoice detail page
- [ ] Add PDF export capability

### Phase 3: Contract Management (Week 3-4)
- [ ] Create Contract API endpoints
- [ ] Create Contract management pages (list, create, edit, detail)
- [ ] Implement contract status workflow

### Phase 4: Financial Reporting (Week 4-6)
- [ ] Create financial metrics API
- [ ] Create P&L Report page
- [ ] Create Revenue Report page
- [ ] Create Invoice Aging Report page

### Phase 5: Advanced Analytics (Week 6-7)
- [ ] Create Ad Campaign ROI tracking
- [ ] Create Cash Flow Report
- [ ] Create Financial Dashboard with KPIs
- [ ] Add export/scheduling capabilities

---

## 7. KEY CALCULATIONS & FORMULAS

### Profit & Loss
```
Gross Revenue = Sum of all invoice amounts
Returns/Adjustments = Discounts + Credits
Net Revenue = Gross Revenue - Returns

Cost of Revenue = COGS (if applicable)
Gross Profit = Net Revenue - Cost of Revenue
Gross Margin % = (Gross Profit / Net Revenue) * 100

Operating Expenses = Sum of all expense categories
Operating Income = Gross Profit - Operating Expenses
Operating Margin % = (Operating Income / Net Revenue) * 100

Interest & Other = Interest Expense - Interest Income
Net Income = Operating Income - Interest & Other - Taxes
Net Profit Margin % = (Net Income / Net Revenue) * 100
```

### Invoice Aging
```
Current = Invoices due in future
30 Days = Invoices 0-30 days overdue
60 Days = Invoices 31-60 days overdue
90 Days = Invoices 61-90 days overdue
Over 90 Days = Invoices > 90 days overdue

Days Sales Outstanding (DSO) = (Accounts Receivable / Total Revenue) × Number of Days
```

### Ad Campaign ROI
```
Ad Spend = Sum of actual expenses on campaign
Revenue Generated = Revenue attributed to campaign (if tracked)
ROI % = ((Revenue - Cost) / Cost) × 100
Cost Per Acquisition (CPA) = Total Cost / Number of Conversions
```

### Cash Flow
```
Operating Cash Flow = Net Income + Depreciation - Change in Working Capital
Investing Cash Flow = Capital Expenditures + Asset Sales
Financing Cash Flow = Debt Payments + Equity Changes
Net Cash Flow = Operating + Investing + Financing
Ending Cash = Beginning Cash + Net Cash Flow
```

---

## 8. TYPES & INTERFACES

```typescript
// Invoice Types
interface Invoice {
  id: string
  invoiceNumber: string
  organizationId: string
  clientId: string
  contractId?: string
  issueDate: Date
  dueDate: Date
  subtotal: Decimal
  taxAmount?: Decimal
  discount?: Decimal
  totalAmount: Decimal
  status: InvoiceStatus
  items: InvoiceItem[]
  payments: Payment[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Financial Summary
interface FinancialSummary {
  period: { startDate: Date, endDate: Date }
  revenue: { total: Decimal, invoices: Decimal, contracts: Decimal }
  expenses: { total: Decimal, breakdown: Record<string, Decimal> }
  profit: { gross: Decimal, net: Decimal }
  metrics: {
    profitMargin: number
    collectionRate: number
    revenueGrowth: number
  }
}

// P&L Report
interface PLReport {
  period: { startDate: Date, endDate: Date }
  revenue: { total: Decimal, bySource: Record<string, Decimal> }
  expenses: { total: Decimal, byCategory: Record<string, Decimal> }
  profit: { gross: Decimal, operating: Decimal, net: Decimal }
  margins: { gross: number, operating: number, net: number }
}
```

---

## 9. NOTES & CONSIDERATIONS

### Security
- Validate all financial data inputs
- Implement audit logging for all financial transactions
- Restrict invoice/contract access to authorized users
- Encrypt sensitive financial information

### Performance
- Implement caching for frequently accessed financial data
- Use pagination for large result sets
- Create database indexes on date and status fields
- Consider materialized views for complex calculations

### Compliance
- Maintain invoice/contract audit trail
- Ensure GDPR compliance for client data
- Implement data retention policies
- Support financial reporting requirements

### Integration Opportunities
- SMS reminders for overdue invoices
- Email notifications for new invoices
- Cloud storage for contract documents
- Accounting software integration (QuickBooks, Xero)
- Payment gateway integration (Hubtel, Stripe)

---

## 10. SUCCESS METRICS

Track these metrics once implemented:
- Average time to complete invoice cycle
- Invoice payment collection rate
- Days Sales Outstanding (DSO)
- Profit margin tracking
- Contract value realization
- Ad campaign ROI accuracy

---

**Version:** 1.0
**Last Updated:** 2024-11-17
**Status:** Planning Phase
