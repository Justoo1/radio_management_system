/**
 * Overdue Bill Email Template
 * Sent when a bill becomes overdue
 */

import * as React from 'react'

interface OverdueBillEmailProps {
  organizationName: string
  billAmount: number
  billingMonth: string
  daysOverdue: number
  contactPhone: string
  contactEmail: string
}

export const OverdueBillEmail = ({
  organizationName,
  billAmount,
  billingMonth,
  daysOverdue,
  contactPhone,
  contactEmail,
}: OverdueBillEmailProps) => (
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
        .alert {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
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
        <h1>⚠️ Payment Overdue</h1>
      </div>
      <div className="content">
        <p>Dear {organizationName},</p>

        <div className="alert">
          <strong>Urgent:</strong> Your payment for {billingMonth} is now <strong>{daysOverdue} days overdue</strong>.
        </div>

        <p>
          We noticed that your subscription payment has not been received. To continue using the Radio Management System without interruption, please make your payment as soon as possible.
        </p>

        <div className="amount">
          GH₵ {billAmount.toLocaleString()}
        </div>

        <p><strong>Payment Information:</strong></p>
        <ul>
          <li>Billing Period: {billingMonth}</li>
          <li>Amount Due: GH₵ {billAmount.toLocaleString()}</li>
          <li>Days Overdue: {daysOverdue} days</li>
        </ul>

        <p><strong>How to Pay:</strong></p>
        <ol>
          <li>Send payment via Mobile Money (MTN, Vodafone, or AirtelTigo)</li>
          <li>Contact us to confirm payment</li>
          <li>We'll activate your account immediately</li>
        </ol>

        <p><strong>Contact Us:</strong></p>
        <ul>
          <li>Phone: {contactPhone}</li>
          <li>Email: {contactEmail}</li>
        </ul>

        <a href="https://radiomgmt.com/settings/billing" className="button">
          Make Payment
        </a>

        <div className="footer">
          <p>
            If you've already made this payment, please contact us immediately so we can update your account.
          </p>
          <p>
            Thank you for using Radio Management System.
          </p>
        </div>
      </div>
    </body>
  </html>
)

export default OverdueBillEmail
