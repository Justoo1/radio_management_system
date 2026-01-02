/**
 * Cron Job: Check for Overdue Bills
 * Sends notifications for unpaid bills past due date
 * Should run daily to check for overdue bills
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'
import { OverdueBillEmail } from '@/emails/overdue-bill'

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
        const contactEmail = process.env.ADMIN_EMAIL || 'billing@radiomgmt.com'

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

    // If you have notifications, you can send them to yourself (admin)
    if (notifications.length > 0) {
      // Send summary email to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@radiomgmt.com'
      const adminPhone = process.env.ADMIN_PHONE || '+233123456789'

      console.log(`
📧 ADMIN NOTIFICATION SUMMARY
=============================
Total Overdue Bills: ${notifications.length}
Admin Email: ${adminEmail}
Admin Phone: ${adminPhone}

Organizations with overdue bills:
${notifications.map(n => `- ${n.organizationName}: GH₵ ${n.billAmount} (${n.daysOverdue} days overdue)`).join('\n')}
=============================
      `)

      // In production, integrate with:
      // - Email service (SendGrid, AWS SES, etc.)
      // - SMS service (Twilio, etc.)
      // - WhatsApp Business API
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

export const dynamic = 'force-dynamic'
