import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email og navn er påkrævet' },
        { status: 400 }
      )
    }

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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
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
