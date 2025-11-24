import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getRedis, REDIS_CHANNELS } from '@/lib/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export interface SocketServer extends SocketIOServer {
  isInitialized?: boolean;
}

let io: SocketServer | null = null;

export const initSocket = (server: HTTPServer): SocketServer => {
  if (io && io.isInitialized) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket/io',
    addTrailingSlash: false,
  }) as SocketServer;

  // Setup Redis adapter for horizontal scaling
  const redis = getRedis();
  const pubClient = redis;
  const subClient = pubClient.duplicate();

  Promise.resolve(subClient).then((sub) => {
    io!.adapter(createAdapter(pubClient, sub));
    console.log('✅ Socket.IO Redis adapter initialized');
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join organization room
    socket.on('join:organization', async (data: { organizationId: string; userId: string }) => {
      const { organizationId, userId } = data;

      if (!organizationId) {
        socket.emit('error', { message: 'Organization ID is required' });
        return;
      }

      // Join organization room
      await socket.join(`org:${organizationId}`);

      // Store user info in socket data
      socket.data.organizationId = organizationId;
      socket.data.userId = userId;

      console.log(`✅ User ${userId} joined organization ${organizationId}`);

      socket.emit('joined:organization', { organizationId });
    });

    // Join on-air dashboard
    socket.on('join:dashboard', async (data: { organizationId: string }) => {
      const { organizationId } = data;
      await socket.join(`org:${organizationId}:dashboard`);
      console.log(`📻 User joined on-air dashboard for org ${organizationId}`);
    });

    // Update queue position
    socket.on('queue:update', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      // Publish to Redis for other servers
      const redis = getRedis();
      await redis.publish(
        REDIS_CHANNELS.QUEUE_UPDATE(organizationId),
        JSON.stringify(data)
      );

      // Emit to all clients in organization
      io!.to(`org:${organizationId}:dashboard`).emit('queue:updated', data);
    });

    // Play song
    socket.on('song:play', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      const redis = getRedis();
      await redis.publish(
        REDIS_CHANNELS.ON_AIR_NOW(organizationId),
        JSON.stringify({ action: 'play', ...data })
      );

      io!.to(`org:${organizationId}:dashboard`).emit('now-playing:update', data);
    });

    // Skip song
    socket.on('song:skip', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      const redis = getRedis();
      await redis.publish(
        REDIS_CHANNELS.ON_AIR_NOW(organizationId),
        JSON.stringify({ action: 'skip', ...data })
      );

      io!.to(`org:${organizationId}:dashboard`).emit('song:skipped', data);
    });

    // Play instant audio (jingle, sound effect)
    socket.on('instant:play', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      io!.to(`org:${organizationId}:dashboard`).emit('instant:playing', data);
    });

    // Approve listener request
    socket.on('request:approve', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      io!.to(`org:${organizationId}:dashboard`).emit('request:approved', data);
    });

    // Reject listener request
    socket.on('request:reject', async (data) => {
      const { organizationId } = socket.data;
      if (!organizationId) return;

      io!.to(`org:${organizationId}:dashboard`).emit('request:rejected', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  // Subscribe to Redis channels for cross-server communication
  const setupRedisSubscriptions = async () => {
    const subscriber = getRedis().duplicate();

    subscriber.psubscribe('org:*', (err, count) => {
      if (err) {
        console.error('Failed to subscribe to Redis channels:', err);
      } else {
        console.log(`✅ Subscribed to ${count} Redis patterns`);
      }
    });

    subscriber.on('pmessage', async (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);

        // Extract organization ID from channel
        const match = channel.match(/org:([^:]+):/);
        if (!match) return;

        const orgId = match[1];

        // Route messages to appropriate rooms
        if (channel.includes(':on-air:now')) {
          // Transform data to match NowPlayingData interface
          const nowPlayingData = {
            id: data.data?.id || data.id,
            title: data.data?.title || data.title,
            artist: data.data?.artist || data.artist,
            duration: data.data?.duration || data.duration,
            remainingSeconds: data.data?.remainingSeconds || data.remainingSeconds || data.data?.duration || data.duration,
            startedAt: data.data?.startedAt || data.startedAt,
            endsAt: data.data?.endsAt || data.endsAt,
            thumbnailUrl: data.data?.thumbnailUrl || data.thumbnailUrl,
            itemType: data.data?.itemType || data.itemType || 'PROGRAM',
          };
          io!.to(`org:${orgId}:dashboard`).emit('now-playing:update', nowPlayingData);
        } else if (channel.includes(':on-air:queue')) {
          // Fetch fresh queue and broadcast it
          try {
            const prisma = require('@/lib/prisma').default;
            const freshQueue = await prisma.onAirQueue.findMany({
              where: {
                organizationId: orgId,
                status: 'QUEUED',
              },
              orderBy: {
                position: 'asc',
              },
            });
            io!.to(`org:${orgId}:dashboard`).emit('queue:updated', freshQueue);
          } catch (error) {
            console.error('Error fetching fresh queue:', error);
            io!.to(`org:${orgId}:dashboard`).emit('queue:updated', data);
          }
        } else if (channel.includes(':requests:new')) {
          io!.to(`org:${orgId}:dashboard`).emit('request:new', data);
        } else if (channel.includes(':timer:update')) {
          io!.to(`org:${orgId}:dashboard`).emit('timer:tick', data);
        } else if (channel.includes(':listeners:count')) {
          io!.to(`org:${orgId}:dashboard`).emit('listeners:updated', data);
        }
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });
  };

  setupRedisSubscriptions();

  io.isInitialized = true;
  console.log('✅ Socket.IO server initialized');

  return io;
};

export const getIO = (): SocketServer | null => {
  return io;
};

// Helper functions to emit events from anywhere in the app
export const emitToOrganization = (orgId: string, event: string, data: any) => {
  if (io) {
    io.to(`org:${orgId}`).emit(event, data);
  }
};

export const emitToDashboard = (orgId: string, event: string, data: any) => {
  if (io) {
    io.to(`org:${orgId}:dashboard`).emit(event, data);
  }
};
