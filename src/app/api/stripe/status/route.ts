import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/payload/auth-actions';
import { getSubscriptionStatus } from '@/lib/stripe/actions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const status = await getSubscriptionStatus(user.id);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
