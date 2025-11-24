import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getListenerRequests, createListenerRequest } from '@/lib/services/onair';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const requests = await getListenerRequests(organizationId, status);

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;
    const body = await req.json();

    const request = await createListenerRequest({
      organizationId,
      ...body,
    });

    return NextResponse.json(request);
  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create request' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
