import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInstantAudios } from '@/lib/services/onair';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;

    const instantAudios = await getInstantAudios(organizationId);

    return NextResponse.json(instantAudios);
  } catch (error: any) {
    console.error('Error fetching instant audios:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch instant audios' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
