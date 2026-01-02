/**
 * Admin Overdue Bills Summary Email Template
 * Sent daily to admin with summary of all overdue bills
 */

import * as React from 'react'

interface OverdueBill {
  organizationName: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  billAmount: number
  billingPeriod: string
  daysOverdue: number
}

interface AdminOverdueSummaryEmailProps {
  overdueBills: OverdueBill[]
  totalAmount: number
  date: string
}

export const AdminOverdueSummaryEmail = ({
  overdueBills,
  totalAmount,
  date,
}: AdminOverdueSummaryEmailProps) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #ea580c);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .summary-box {
          background: white;
          border: 2px solid #dc2626;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          text-align: center;
        }
        .summary-number {
          font-size: 48px;
          font-weight: bold;
          color: #dc2626;
          margin: 10px 0;
        }
        .summary-label {
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bill-card {
          background: white;
          border-left: 4px solid #dc2626;
          padding: 16px;
          margin: 12px 0;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .bill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .org-name {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        }
        .amount {
          font-size: 20px;
          font-weight: bold;
          color: #dc2626;
        }
        .bill-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 14px;
        }
        .detail-label {
          color: #6b7280;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .overdue-badge {
          display: inline-block;
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .action-required {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 16px;
          margin: 20px 0;
          border-radius: 6px;
        }
      `}</style>
    </head>
    <body>
      <div className="header">
        <h1>⚠️ Overdue Bills Report</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>{date}</p>
      </div>
      <div className="content">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div className="summary-box" style={{ flex: 1 }}>
            <div className="summary-label">Total Overdue</div>
            <div className="summary-number">{overdueBills.length}</div>
            <div className="summary-label">Organizations</div>
          </div>
          <div className="summary-box" style={{ flex: 1 }}>
            <div className="summary-label">Total Amount</div>
            <div className="summary-number">GH₵ {totalAmount.toLocaleString()}</div>
            <div className="summary-label">Outstanding</div>
          </div>
        </div>

        <div className="action-required">
          <strong>⚡ Action Required:</strong> The following organizations have overdue payments and need to be contacted for payment collection.
        </div>

        <h2 style={{ color: '#1f2937', marginTop: '30px' }}>Overdue Bills Details</h2>

        {overdueBills.map((bill, index) => (
          <div key={index} className="bill-card">
            <div className="bill-header">
              <div>
                <div className="org-name">{bill.organizationName}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {bill.ownerName} • {bill.ownerEmail}
                </div>
              </div>
              <div className="amount">GH₵ {bill.billAmount.toLocaleString()}</div>
            </div>

            <div className="bill-details">
              <div>
                <span className="detail-label">Billing Period:</span>
                <div className="detail-value">{bill.billingPeriod}</div>
              </div>
              <div>
                <span className="detail-label">Days Overdue:</span>
                <div>
                  <span className="overdue-badge">{bill.daysOverdue} days</span>
                </div>
              </div>
              <div>
                <span className="detail-label">Phone:</span>
                <div className="detail-value">{bill.ownerPhone || 'N/A'}</div>
              </div>
              <div>
                <span className="detail-label">Email:</span>
                <div className="detail-value">{bill.ownerEmail}</div>
              </div>
            </div>
          </div>
        ))}

        <div className="footer">
          <h3 style={{ color: '#1f2937' }}>Recommended Actions</h3>
          <ol>
            <li>Contact each organization via phone or email</li>
            <li>Send payment reminder via Mobile Money</li>
            <li>If overdue &gt; 7 days: Consider service suspension warning</li>
            <li>If overdue &gt; 14 days: Suspend access until payment received</li>
            <li>Log all payment collection attempts</li>
          </ol>

          <p style={{ marginTop: '20px' }}>
            <strong>Auto-Actions Taken:</strong>
            <ul>
              <li>✅ Bill status updated to OVERDUE</li>
              <li>✅ Email notification sent to organization owners</li>
              <li>✅ Organizations with 14+ days overdue have been auto-suspended</li>
            </ul>
          </p>

          <p style={{ marginTop: '20px', padding: '16px', background: 'white', borderRadius: '6px' }}>
            <strong>💡 Tip:</strong> Use Mobile Money payment confirmations to quickly activate suspended accounts via the admin dashboard.
          </p>
        </div>
      </div>
    </body>
  </html>
)

export default AdminOverdueSummaryEmail
