import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import { getPayload } from 'payload';
import config from '@/lib/payload/payload.config';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = await getPayload({ config });

  try {
    switch (event.type) {
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerUpdate(event.data.object as Stripe.Customer, payload);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, payload);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, payload);
        break;

      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await handleInvoiceUpdate(event.data.object as Stripe.Invoice, payload);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, payload);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCustomerUpdate(customer: Stripe.Customer, payload: any) {
  // Find user by Stripe customer ID
  const users = await payload.find({
    collection: 'users',
    where: { stripeCustomerId: { equals: customer.id } },
  });

  if (users.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: users.docs[0].id,
      data: { billingEmail: customer.email || undefined },
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, payload: any) {
  const sub = subscription as any; // Cast to any to access all Stripe properties
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Find user
  const users = await payload.find({
    collection: 'users',
    where: { stripeCustomerId: { equals: customerId } },
  });

  if (users.docs.length === 0) return;

  const user = users.docs[0];

  // Upsert subscription
  const existingSubs = await payload.find({
    collection: 'subscriptions',
    where: { stripeSubscriptionId: { equals: subscription.id } },
  });

  const subscriptionData: any = {
    user: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: subscription.items.data[0]?.price.id || '',
    status: subscription.status,
    currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
    trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : undefined,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
    metadata: subscription.metadata,
  };

  if (existingSubs.docs.length > 0) {
    await payload.update({
      collection: 'subscriptions',
      id: existingSubs.docs[0].id,
      data: subscriptionData,
    });
  } else {
    await payload.create({
      collection: 'subscriptions',
      data: subscriptionData,
    });
  }

  // Update user subscription status
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status as any,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, payload: any) {
  const existingSubs = await payload.find({
    collection: 'subscriptions',
    where: { stripeSubscriptionId: { equals: subscription.id } },
  });

  if (existingSubs.docs.length > 0) {
    await payload.update({
      collection: 'subscriptions',
      id: existingSubs.docs[0].id,
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    // Update user
    const sub = existingSubs.docs[0];
    await payload.update({
      collection: 'users',
      id: typeof sub.user === 'string' ? sub.user : sub.user.id,
      data: {
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });
  }
}

async function handleInvoiceUpdate(invoice: Stripe.Invoice, payload: any) {
  const inv = invoice as any; // Cast to any to access all Stripe properties
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const users = await payload.find({
    collection: 'users',
    where: { stripeCustomerId: { equals: customerId } },
  });

  if (users.docs.length === 0) return;

  const user = users.docs[0];

  const existingInvoices = await payload.find({
    collection: 'invoices',
    where: { stripeInvoiceId: { equals: invoice.id } },
  });

  const invoiceData: any = {
    user: user.id,
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    amount: inv.amount_due,
    currency: inv.currency,
    status: inv.status || 'draft',
    paid: inv.paid,
    invoiceUrl: inv.hosted_invoice_url || undefined,
    pdfUrl: inv.invoice_pdf || undefined,
    dueDate: inv.due_date ? new Date(inv.due_date * 1000) : undefined,
    paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
    metadata: invoice.metadata,
  };

  if (existingInvoices.docs.length > 0) {
    await payload.update({
      collection: 'invoices',
      id: existingInvoices.docs[0].id,
      data: invoiceData,
    });
  } else {
    await payload.create({
      collection: 'invoices',
      data: invoiceData,
    });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, payload: any) {
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  if (!customerId || !session.subscription) return;

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(subscription, payload);
}
