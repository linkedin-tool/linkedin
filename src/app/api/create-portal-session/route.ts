import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { customerId, returnUrl, subscriptionId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID er påkrævet' },
        { status: 400 }
      )
    }

    const portalConfig: any = {
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=subscription`,
    }

    // If subscriptionId is provided, configure flow to go directly to subscription management
    if (subscriptionId) {
      portalConfig.flow_data = {
        type: 'subscription_update',
        subscription_update: {
          subscription: subscriptionId
        }
      }
    }

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create(portalConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl ved oprettelse af portal session' },
      { status: 500 }
    )
  }
}
