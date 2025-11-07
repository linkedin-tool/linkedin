import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { customerId, newPriceId, upgradeType } = await request.json()

    if (!customerId || !newPriceId || !upgradeType) {
      return NextResponse.json(
        { error: 'Customer ID, price ID og upgrade type er påkrævet' },
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
