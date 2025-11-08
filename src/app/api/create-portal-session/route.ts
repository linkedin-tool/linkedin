import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { customerId, returnUrl, subscriptionId, directToRelease } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID er påkrævet' },
        { status: 400 }
      )
    }

    // If we want to go directly to the release page, create a portal session and modify the URL
    if (directToRelease && subscriptionId) {
      try {
        // Create a regular portal session first
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=subscription`,
        })

        // Extract the session ID from the portal URL and construct the direct release URL
        const portalUrl = session.url
        const sessionMatch = portalUrl.match(/\/p\/session\/([^\/]+)\//)
        
        if (sessionMatch) {
          const sessionId = sessionMatch[1]
          const releaseUrl = `https://billing.stripe.com/p/session/${sessionId}/subscriptions/${subscriptionId}/release`
          return NextResponse.json({ url: releaseUrl })
        } else {
          // Fallback to regular portal if we can't extract session ID
          return NextResponse.json({ url: portalUrl })
        }
      } catch (error) {
        console.error('Error creating direct release URL:', error)
        // Fallback to regular portal
      }
    }

    const portalConfig: any = {
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=subscription`,
    }

    // If subscriptionId is provided, configure flow to go directly to subscription management
    if (subscriptionId && !directToRelease) {
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
