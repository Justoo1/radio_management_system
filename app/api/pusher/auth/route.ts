/**
 * Pusher Authentication Endpoint
 * Authenticates users for private and presence channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    const pusher = getPusherServer();

    // Handle presence channels for public chat (no auth required)
    if (channelName.startsWith('presence-chat-')) {
      const orgSlug = channelName.replace('presence-chat-', '');

      // Verify organization exists and is active
      const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true, status: true, enabledFeatures: true },
      });

      if (!organization) {
        return NextResponse.json({ error: 'Station not found' }, { status: 404 });
      }

      if (organization.status !== 'ACTIVE' && organization.status !== 'TRIAL') {
        return NextResponse.json({ error: 'Station not available' }, { status: 403 });
      }

      // Get user name from query params or generate anonymous ID
      const userName = params.get('user_name') || 'Anonymous';
      const odisplayName = params.get('display_name') || userName;

      // Generate unique user ID for this session
      const oduserId = `listener_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Authenticate presence channel with user data
      const presenceData = {
        user_id: oduserId,
        user_info: {
          name: odisplayName,
        },
      };

      const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(authResponse);
    }

    // For private channels, require authentication
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user has access to this channel
    // Channel format: private-org-{organizationId}-{feature}
    const orgId = session.user.organizationId;

    // Check if channel belongs to user's organization
    if (!channelName.includes(`org-${orgId}`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Authenticate the channel
    const authResponse = pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
