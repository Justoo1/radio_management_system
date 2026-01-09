/**
 * Cron Job: Check for Overdue Bills
 * Sends notifications for unpaid bills past due date
 * Should run daily to check for overdue bills
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'
import { OverdueBillEmail } from '@/emails/overdue-bill'
import { AdminOverdueSummaryEmail } from '@/emails/admin-overdue-summary'
import { notifyPaymentDue } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (use a secret token for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all pending bills that are past due date
    const overdueBills = await prisma.bill.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now, // Due date has passed
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            email: true,
            owner: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    const notifications: any[] = []

    for (const bill of overdueBills) {
      // Update bill status to OVERDUE
      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          status: 'OVERDUE',
          overdueNoticeSentAt: now,
        },
      })

      // Send notification (email/SMS)
      // In production, integrate with your email/SMS service
      const notification = {
        organizationId: bill.organizationId,
        organizationName: bill.organization.name,
        ownerName: bill.organization.owner?.name,
        ownerEmail: bill.organization.owner?.email,
        ownerPhone: bill.organization.owner?.phone,
        billAmount: Number(bill.amount),
        dueDate: bill.dueDate,
        billingPeriod: `${getMonthName(bill.billingMonth)} ${bill.billingYear}`,
        daysOverdue: Math.floor((now.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      }

      notifications.push(notification)

      // Send email notification using Resend
      try {
        const contactPhone = process.env.ADMIN_PHONE || '+233 XX XXX XXXX'
        const contactEmail = process.env.ADMIN_EMAIL || 'billing@radio.edtymsys.com'

        await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: notification.ownerEmail || bill.organization.email,
          subject: `⚠️ Payment Overdue - ${notification.billingPeriod}`,
          react: OverdueBillEmail({
            organizationName: notification.organizationName,
            billAmount: notification.billAmount,
            billingMonth: notification.billingPeriod,
            daysOverdue: notification.daysOverdue,
            contactPhone,
            contactEmail,
          }),
        })

        console.log(`✅ Sent overdue email to ${notification.ownerEmail}`)
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${notification.ownerEmail}:`, emailError)
      }

      // Send push notification
      try {
        await notifyPaymentDue(notification.organizationId, {
          amount: notification.billAmount,
          currency: 'GHS',
          dueDate: notification.dueDate,
        })
        console.log(`📱 Sent push notification to ${notification.organizationName}`)
      } catch (pushError) {
        console.error(`❌ Failed to send push notification:`, pushError)
      }

      // Log to console
      console.log(`
🔔 OVERDUE BILL NOTIFICATION
=============================
Organization: ${notification.organizationName}
Owner: ${notification.ownerName} (${notification.ownerEmail})
Phone: ${notification.ownerPhone || 'N/A'}
Amount: GH₵ ${notification.billAmount}
Period: ${notification.billingPeriod}
Due Date: ${notification.dueDate.toLocaleDateString()}
Days Overdue: ${notification.daysOverdue}
=============================
      `)
    }

    // Auto-suspend organizations with 14+ days overdue
    const suspendedOrgs = []
    for (const notification of notifications) {
      if (notification.daysOverdue >= 14) {
        await prisma.organization.update({
          where: { id: notification.organizationId },
          data: { status: 'SUSPENDED' }
        })
        suspendedOrgs.push(notification.organizationName)
        console.log(`🔒 Auto-suspended: ${notification.organizationName} (${notification.daysOverdue} days overdue)`)
      }
    }

    // Send summary email to admin
    if (notifications.length > 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@radio.edtymsys.com'
      const totalAmount = notifications.reduce((sum, n) => sum + n.billAmount, 0)

      console.log(`
📧 ADMIN NOTIFICATION SUMMARY
=============================
Total Overdue Bills: ${notifications.length}
Total Amount: GH₵ ${totalAmount}
Auto-Suspended: ${suspendedOrgs.length} organizations
Admin Email: ${adminEmail}

Organizations with overdue bills:
${notifications.map(n => `- ${n.organizationName}: GH₵ ${n.billAmount} (${n.daysOverdue} days overdue)`).join('\n')}

${suspendedOrgs.length > 0 ? `\nAuto-Suspended Organizations:\n${suspendedOrgs.map(org => `- ${org}`).join('\n')}` : ''}
=============================
      `)

      // Send admin email notification via Resend
      try {
        await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: adminEmail,
          subject: `⚠️ Overdue Bills Report - ${notifications.length} Organizations`,
          react: AdminOverdueSummaryEmail({
            overdueBills: notifications.map(n => ({
              organizationName: n.organizationName,
              ownerName: n.ownerName || 'N/A',
              ownerEmail: n.ownerEmail || 'N/A',
              ownerPhone: n.ownerPhone,
              billAmount: n.billAmount,
              billingPeriod: n.billingPeriod,
              daysOverdue: n.daysOverdue,
            })),
            totalAmount,
            date: new Date().toLocaleDateString('en-GH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
          }),
        })
        console.log(`✅ Sent admin summary email to ${adminEmail}`)
      } catch (emailError) {
        console.error(`❌ Failed to send admin email:`, emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueBills.length} overdue bills`,
      notifications,
      date: now.toISOString(),
    })
  } catch (error) {
    console.error('Error checking overdue bills:', error)
    return NextResponse.json(
      { error: 'Failed to check overdue bills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}

// Also allow GET for cron services that only support GET
export async function GET(request: NextRequest) {
  return POST(request)
}

export const dynamic = 'force-dynamic'
