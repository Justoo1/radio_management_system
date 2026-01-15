/**
 * Booking Approved Email Template
 * Sent when an airtime booking is approved with broadcast credentials
 */

import * as React from 'react'

interface BookingApprovedEmailProps {
  guestName: string
  organizationName: string
  bookingRef: string
  programTitle: string
  approvedDate: string
  approvedStartTime: string
  approvedEndTime: string
  djUsername: string
  djPassword: string
  broadcastPortalUrl: string
}

export const BookingApprovedEmail = ({
  guestName,
  organizationName,
  bookingRef,
  programTitle,
  approvedDate,
  approvedStartTime,
  approvedEndTime,
  djUsername,
  djPassword,
  broadcastPortalUrl,
}: BookingApprovedEmailProps) => (
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
          background: linear-gradient(135deg, #10B981, #06B6D4);
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
        .success-badge {
          background: #d1fae5;
          border: 2px solid #10B981;
          padding: 16px;
          margin: 20px 0;
          border-radius: 8px;
          text-align: center;
        }
        .success-badge h2 {
          color: #059669;
          margin: 0;
        }
        .credentials-box {
          background: #ecfdf5;
          border: 2px solid #10B981;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .credentials-box h3 {
          color: #059669;
          margin-top: 0;
        }
        .credential-item {
          background: white;
          padding: 12px 16px;
          margin: 10px 0;
          border-radius: 6px;
          font-family: monospace;
          font-size: 16px;
        }
        .schedule-box {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #10B981, #06B6D4);
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
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
        <h1>Your Booking is Approved!</h1>
        <p>{organizationName}</p>
      </div>
      <div className="content">
        <p>Dear {guestName},</p>

        <div className="success-badge">
          <h2>Booking Confirmed</h2>
          <p style={{ margin: '10px 0 0 0', color: '#059669' }}>Reference: <strong>{bookingRef}</strong></p>
        </div>

        <p>
          Great news! Your airtime booking for <strong>{programTitle}</strong> has been approved.
          You can now access the broadcast portal at your scheduled time.
        </p>

        <div className="schedule-box">
          <strong>Scheduled Broadcast Time:</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '18px' }}>
            {approvedDate}<br />
            {approvedStartTime} - {approvedEndTime}
          </p>
        </div>

        <div className="credentials-box">
          <h3>Your Broadcast Credentials</h3>
          <p>Use these credentials to connect via Web DJ:</p>
          <div className="credential-item">
            <strong>Username:</strong> {djUsername}
          </div>
          <div className="credential-item">
            <strong>Password:</strong> {djPassword}
          </div>
        </div>

        <div className="warning">
          <strong>Important:</strong> These credentials will only work during your scheduled time slot.
          Please be ready to connect a few minutes before your broadcast time.
        </div>

        <p style={{ textAlign: 'center' }}>
          <a href={broadcastPortalUrl} className="button">
            Go to Broadcast Portal
          </a>
        </p>

        <p><strong>How to Broadcast:</strong></p>
        <ol>
          <li>Click the "Go to Broadcast Portal" button above at your scheduled time</li>
          <li>Enter your username and password</li>
          <li>Allow microphone access when prompted</li>
          <li>Click "Start Broadcasting" to go live!</li>
        </ol>

        <div className="footer">
          <p>
            If you have any questions or need assistance, please contact {organizationName} directly.
          </p>
          <p>
            Thank you for choosing to broadcast with us!
          </p>
        </div>
      </div>
    </body>
  </html>
)

export default BookingApprovedEmail
