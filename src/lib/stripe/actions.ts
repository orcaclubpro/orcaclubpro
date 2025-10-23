'use server'

import { stripe } from './stripe';
import { getPayload } from 'payload';
import config from '@/lib/payload/payload.config';
import { getCurrentUser } from '@/lib/payload/auth-actions';

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string) {
  const payload = await getPayload({ config });

  // Check if user already has Stripe customer ID
  const user = await payload.findByID({ collection: 'users', id: userId }) as any;

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  });

  // Update user with Stripe customer ID
  await payload.update({
    collection: 'users',
    id: userId,
    data: { stripeCustomerId: customer.id } as any,
  });

  return customer.id;
}

// Create checkout session
export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email, user.name);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: user.id },
  });

  return session.url;
}

// Create billing portal session
export async function createBillingPortalSession(returnUrl: string) {
  const user = await getCurrentUser();

  if (!user || !user.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

// Get subscription status
export async function getSubscriptionStatus(userId: string) {
  const payload = await getPayload({ config });

  const user = await payload.findByID({ collection: 'users', id: userId }) as any;

  return {
    status: user.subscriptionStatus || 'free',
    tier: user.subscriptionTier || 'free',
  };
}
