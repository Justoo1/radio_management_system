/**
 * Bill Reminder Email Template
 * Sent when a bill is due soon (7 days before due date)
 */

import * as React from 'react'

interface BillReminderEmailProps {
  organizationName: string
  billAmount: number
  billingMonth: string
  daysUntilDue: number
  contactPhone: string
  contactEmail: string
}

export const BillReminderEmail = ({
  organizationName,
  billAmount,
  billingMonth,
  daysUntilDue,
  contactPhone,
  contactEmail,
}: BillReminderEmailProps) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
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
        .info {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #8B5CF6;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </head>
    <body>
      <div className="header">
        <h1>📅 Payment Reminder</h1>
      </div>
      <div className="content">
        <p>Dear {organizationName},</p>

        <div className="info">
          <strong>Reminder:</strong> Your subscription payment is due in <strong>{daysUntilDue} days</strong>.
        </div>

        <p>
          This is a friendly reminder that your monthly subscription payment will be due soon. Please ensure payment is made before the due date to avoid any service interruption.
        </p>

        <div className="amount">
          GH₵ {billAmount.toLocaleString()}
        </div>

        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Billing Period: {billingMonth}</li>
          <li>Amount Due: GH₵ {billAmount.toLocaleString()}</li>
          <li>Days Until Due: {daysUntilDue} days</li>
        </ul>

        <p><strong>Payment Methods:</strong></p>
        <ul>
          <li>MTN Mobile Money</li>
          <li>Vodafone Cash</li>
          <li>AirtelTigo Money</li>
        </ul>

        <p><strong>Contact Us:</strong></p>
        <ul>
          <li>Phone: {contactPhone}</li>
          <li>Email: {contactEmail}</li>
        </ul>

        <a href="https://radio.edtmsys.com/settings/billing" className="button">
          View Billing Details
        </a>

        <div className="footer">
          <p>
            If you've already made this payment, please disregard this reminder.
          </p>
          <p>
            Thank you for choosing Radio Management System!
          </p>
        </div>
      </div>
    </body>
  </html>
)

export default BillReminderEmail
