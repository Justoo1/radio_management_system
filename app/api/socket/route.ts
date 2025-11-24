import { NextRequest } from 'next/server';
import { Server as HTTPServer } from 'http';
import { Server as NetServer, Socket } from 'net';
import { Server as SocketIOServer } from 'socket.io';
import { initSocket } from '@/lib/socket/server';

export interface NextApiResponseWithSocket extends Response {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

// This route is handled differently - it upgrades to WebSocket
export async function GET(req: NextRequest) {
  // Socket.IO initialization will happen through the custom server
  // For Next.js development, we'll use a different approach

  return new Response('Socket.IO server is running on /api/socket/io', {
    status: 200,
  });
}

export const dynamic = 'force-dynamic';
