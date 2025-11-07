import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { email, name, plan } = await request.json()

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

    // Check if customer has existing subscription for upgrades
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    // If customer has existing subscription, we need to handle upgrade differently
    if (existingSubscriptions.data.length > 0) {
      const currentSubscription = existingSubscriptions.data[0]
      const currentPriceId = currentSubscription.items.data[0].price.id
      
      // Only allow upgrade from Pro to Team
      if (currentPriceId === STRIPE_PRICE_ID && priceId === STRIPE_PRICE_ID_TEAM) {
        // For Pro to Team upgrade, create a one-time payment for the difference
        // and then update the subscription
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'dkk',
                product_data: {
                  name: 'Upgrade til Team Plan',
                  description: 'Opgradering fra Pro til Team - betaling af difference'
                },
                unit_amount: 80400, // 804 kr difference (999 - 195)
              },
              quantity: 1,
            },
          ],
          mode: 'payment', // One-time payment instead of subscription
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
          metadata: {
            customer_email: email,
            customer_name: name,
            subscription_id: currentSubscription.id,
            upgrade_to: 'team'
          },
          allow_promotion_codes: true,
          billing_address_collection: 'required',
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })
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
