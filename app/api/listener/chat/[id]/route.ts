/**
 * Chat Message Moderation API
 * Hide, delete, pin, or flag specific messages
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { triggerChatEvent, PUSHER_EVENTS } from '@/lib/pusher/server';
import { z } from 'zod';

const moderationSchema = z.object({
  action: z.enum(['hide', 'show', 'delete', 'pin', 'unpin', 'flag']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = moderationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { action } = validationResult.data;

    // Find message and verify ownership
    const message = await prisma.listenerChatMessage.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        organization: {
          select: { slug: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Perform action
    let updateData: any = {
      moderatedById: session.user.id,
      moderatedAt: new Date(),
    };

    switch (action) {
      case 'hide':
        updateData.status = 'HIDDEN';
        break;
      case 'show':
        updateData.status = 'VISIBLE';
        break;
      case 'delete':
        updateData.status = 'DELETED';
        break;
      case 'pin':
        updateData.isPinned = true;
        break;
      case 'unpin':
        updateData.isPinned = false;
        break;
      case 'flag':
        updateData.status = 'FLAGGED';
        break;
    }

    const updatedMessage = await prisma.listenerChatMessage.update({
      where: { id },
      data: updateData,
    });

    // Trigger real-time event for deletions and pins
    if (action === 'delete' || action === 'hide') {
      await triggerChatEvent(message.organization.slug, PUSHER_EVENTS.CHAT_MESSAGE_DELETED, {
        id: message.id,
      });
    } else if (action === 'pin') {
      await triggerChatEvent(message.organization.slug, PUSHER_EVENTS.CHAT_MESSAGE_PINNED, {
        id: message.id,
        senderName: message.senderName,
        message: message.message,
        isPinned: true,
        createdAt: message.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error('Error moderating message:', error);
    return NextResponse.json(
      { error: 'Failed to moderate message' },
      { status: 500 }
    );
  }
}

// Delete message permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find and verify ownership
    const message = await prisma.listenerChatMessage.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        organization: {
          select: { slug: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    await prisma.listenerChatMessage.delete({
      where: { id },
    });

    // Trigger real-time event
    await triggerChatEvent(message.organization.slug, PUSHER_EVENTS.CHAT_MESSAGE_DELETED, {
      id: message.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
