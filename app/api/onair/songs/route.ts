import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSongs } from '@/lib/services/onair';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;
    const { searchParams } = new URL(req.url);

    const filters = {
      genre: searchParams.get('genre') || undefined,
      rotation: searchParams.get('rotation') || undefined,
      search: searchParams.get('search') || undefined,
      isActive: true,
    };

    const songs = await getSongs(organizationId, filters);

    return NextResponse.json(songs);
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
