import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/payload/auth-actions';
import { cancelSubscription } from '@/lib/stripe/actions';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const subscription = await cancelSubscription(user.stripeSubscriptionId);

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error: any) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
