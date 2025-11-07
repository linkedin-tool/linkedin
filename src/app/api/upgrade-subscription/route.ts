import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { customerId, targetPlan, upgradeType } = await request.json()

    if (!customerId || !targetPlan || !upgradeType) {
      return NextResponse.json(
        { error: 'Customer ID, target plan og upgrade type er påkrævet' },
        { status: 400 }
      )
    }

    // Determine price ID based on target plan
    let newPriceId: string
    if (targetPlan === 'pro') {
      newPriceId = STRIPE_PRICE_ID
    } else if (targetPlan === 'team') {
      newPriceId = STRIPE_PRICE_ID_TEAM
    } else {
      return NextResponse.json(
        { error: 'Ugyldig target plan. Skal være "pro" eller "team"' },
        { status: 400 }
      )
    }

    // Get customer's current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'Ingen aktiv subscription fundet' },
        { status: 404 }
      )
    }

    const subscription = subscriptions.data[0]
    const subscriptionItem = subscription.items.data[0]

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscriptionItem.id,
        price: newPriceId,
      }],
      // Proration behavior based on upgrade/downgrade
      proration_behavior: upgradeType === 'upgrade' ? 'create_prorations' : 'none',
      // Keep billing cycle unchanged for upgrades
      ...(upgradeType === 'upgrade' && {
        billing_cycle_anchor: 'unchanged'
      })
    })

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      url: `/dashboard?upgraded=${upgradeType}`
    })
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl ved opdatering af abonnement' },
      { status: 500 }
    )
  }
}
