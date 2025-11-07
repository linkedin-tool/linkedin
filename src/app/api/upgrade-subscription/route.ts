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

    const subscription = subscriptions.data[0] as any // Stripe subscription with all properties
    const subscriptionItem = subscription.items.data[0]

    if (upgradeType === 'upgrade') {
      // For upgrades, update subscription immediately with proration
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscriptionItem.id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'unchanged'
      })

      return NextResponse.json({ 
        success: true, 
        subscription: updatedSubscription,
        url: `/dashboard?upgraded=upgrade`
      })
    } else {
      // For downgrades, schedule the change for end of current period
      const currentItems = subscription.items.data.map((item: any) => ({
        price: item.price.id,
        quantity: item.quantity ?? 1,
      }))

      // Create a subscription schedule that maintains current plan until period end
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
        phases: [
          {
            items: currentItems,
            end_date: subscription.current_period_end, // Run current period to completion
            proration_behavior: 'none',
          },
          {
            items: [{ price: newPriceId, quantity: 1 }],
            // Next phase starts at period end with new price
          },
        ],
      })

      return NextResponse.json({ 
        success: true, 
        schedule: schedule,
        url: `/dashboard?downgraded=${targetPlan}&effective_date=${new Date(subscription.current_period_end * 1000).toISOString()}`
      })
    }
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl ved opdatering af abonnement' },
      { status: 500 }
    )
  }
}
