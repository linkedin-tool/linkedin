import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { email, name, plan, isUpgrade } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email og navn er påkrævet' },
        { status: 400 }
      )
    }

    // Determine which price ID to use
    const priceId = plan === 'team' ? STRIPE_PRICE_ID_TEAM : STRIPE_PRICE_ID

    // Create or retrieve Stripe customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name,
      })
    }

    // If this is an upgrade, update existing subscription instead of creating new checkout
    if (isUpgrade && customer) {
      // Get customer's current subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        const subscriptionItem = subscription.items.data[0]

        // Update subscription with new price
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [{
            id: subscriptionItem.id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations',
          billing_cycle_anchor: 'unchanged'
        })

        return NextResponse.json({ 
          success: true, 
          subscription: updatedSubscription,
          url: `/dashboard?upgraded=upgrade`
        })
      }
    }

    // Create Stripe checkout session for new subscriptions
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?canceled=true`,
      metadata: {
        customer_email: email,
        customer_name: name,
      },
      subscription_data: {
        metadata: {
          customer_email: email,
          customer_name: name,
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl ved oprettelse af betalingssession' },
      { status: 500 }
    )
  }
}
