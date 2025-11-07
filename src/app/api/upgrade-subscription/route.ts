import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  console.log('🚀 API upgrade-subscription called')

  try {
    const { customerId, targetPlan, upgradeType } = await request.json()

    console.log('🔄 Upgrade subscription request:', {
      customerId: customerId ? `${customerId.substring(0, 8)}...` : 'MISSING',
      targetPlan,
      upgradeType
    })

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

    // Get customer's current subscription with full data
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

    // Get full subscription details to ensure we have current_period_end
    const fullSubscription = await stripe.subscriptions.retrieve(subscriptions.data[0].id)
    const subscription = fullSubscription as any
    const subscriptionItem = subscription.items.data[0]

    console.log('📊 Full subscription details:', {
      id: subscription.id,
      current_period_end: subscription.current_period_end,
      current_period_start: subscription.current_period_start,
      status: subscription.status,
      schedule: subscription.schedule
    })

    // Check if subscription already has a schedule
    if (subscription.schedule) {
      console.log('⚠️ Subscription already has schedule:', subscription.schedule)
      
      // Cancel the existing schedule and use direct subscription update instead
      console.log('🗑️ Canceling existing schedule to allow new downgrade')
      await stripe.subscriptionSchedules.cancel(subscription.schedule)
      
      // Re-fetch subscription after canceling schedule
      const refreshedSubscription = await stripe.subscriptions.retrieve(subscription.id) as any
      console.log('🔄 Refreshed subscription after schedule cancel:', {
        id: refreshedSubscription.id,
        current_period_end: refreshedSubscription.current_period_end,
        schedule: refreshedSubscription.schedule
      })
      
      // Update the subscription variable to use refreshed data
      Object.assign(subscription, refreshedSubscription)
    }

    if (upgradeType === 'upgrade') {
      // For upgrades, update subscription immediately with proration (old working code)
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
        url: `/dashboard?upgraded=${targetPlan}`
      })
    } else {
      // For downgrades, use subscription schedules to delay the change
      console.log('🗓️ Creating subscription schedule for downgrade')
      
      // Get current items from subscription
      const currentItems = subscription.items.data.map((item: any) => ({
        price: item.price.id,
        quantity: item.quantity ?? 1,
      }))

      console.log('Current items:', currentItems)
      console.log('New price ID:', newPriceId)
      console.log('Period end:', subscription.current_period_end)

      // Validate that we have current_period_end
      if (!subscription.current_period_end) {
        console.log('❌ Missing current_period_end - using direct subscription update instead of schedule')
        
        // Fallback: Use direct subscription update with immediate effect
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [{
            id: subscriptionItem.id,
            price: newPriceId,
          }],
          proration_behavior: 'none', // No proration for downgrades
        })

        console.log('✅ Direct subscription update completed (fallback)')

        return NextResponse.json({
          success: true,
          subscription: updatedSubscription,
          url: `/dashboard?downgraded=${targetPlan}&immediate=true`
        })
      }

      // Create subscription schedule from existing subscription
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
      })

      console.log('✅ Created schedule:', schedule.id)

      // Update the schedule with phases
      const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: currentItems,
            end_date: subscription.current_period_end,
            proration_behavior: 'none',
          },
          {
            items: [{ price: newPriceId, quantity: 1 }],
            proration_behavior: 'none',
          },
        ],
      })

      console.log('✅ Updated schedule with phases')

      return NextResponse.json({
        success: true,
        schedule: updatedSchedule,
        url: `/dashboard?downgraded=${targetPlan}&effective_date=${new Date(subscription.current_period_end * 1000).toISOString()}`
      })
    }
  } catch (error: any) {
    console.error('❌ Error upgrading subscription:', error)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    })

    return NextResponse.json(
      {
        error: 'Der skete en fejl ved opdatering af abonnement',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
