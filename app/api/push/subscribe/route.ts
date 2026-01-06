/**
 * API Route: Push Notification Subscription Management
 * Handles subscribing and unsubscribing from push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, id: userId } = session.user as any;
    const body = await req.json();

    const { subscription, deviceName } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Upsert subscription (update if endpoint exists, create if not)
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers.get('user-agent') || undefined,
        deviceName,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers.get('user-agent') || undefined,
        deviceName,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: pushSubscription.id,
    });
  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * Get current user's push subscriptions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = session.user as any;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        deviceName: true,
        notifyRequests: true,
        notifyChat: true,
        notifyPayments: true,
        notifySystem: true,
        createdAt: true,
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/push/subscribe
 * Update notification preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, preferences } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: {
        notifyRequests: preferences.notifyRequests,
        notifyChat: preferences.notifyChat,
        notifyPayments: preferences.notifyPayments,
        notifySystem: preferences.notifySystem,
      },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    console.error('Error updating push preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
