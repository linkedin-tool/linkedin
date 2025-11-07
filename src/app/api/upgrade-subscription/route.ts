import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

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

    // Get full subscription details
    const fullSubscription = await stripe.subscriptions.retrieve(subscriptions.data[0].id)
    const subscription = fullSubscription as any
    const subscriptionItem = subscription.items.data[0]

    // Get user's current_period_end from Supabase
    const supabase = createAdminClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_period_end')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Bruger ikke fundet' },
        { status: 404 }
      )
    }

    // Check if subscription already has a schedule
    if (subscription.schedule) {
      // If there's already a schedule, update it instead of creating a new one
      if (upgradeType === 'downgrade') {
        // Get current items from subscription
        const currentItems = subscription.items.data.map((item: any) => ({
          price: item.price.id,
          quantity: item.quantity ?? 1,
        }))

        // Use current_period_end from Supabase (convert to Unix timestamp)
        if (!userData.current_period_end) {
          return NextResponse.json(
            { error: 'Mangler periode information for abonnement' },
            { status: 400 }
          )
        }
        
        const endDate = Math.floor(new Date(userData.current_period_end).getTime() / 1000)

        // Update the existing schedule with new phases
        const updatedSchedule = await stripe.subscriptionSchedules.update(subscription.schedule, {
          phases: [
            {
              items: currentItems,
              start_date: 'now',
              end_date: endDate,
              proration_behavior: 'none',
            },
            {
              items: [{ price: newPriceId, quantity: 1 }],
              start_date: endDate,
              proration_behavior: 'none',
            },
          ],
        })

        return NextResponse.json({
          success: true,
          schedule: updatedSchedule,
          url: `/dashboard?downgraded=${targetPlan}&effective_date=${userData.current_period_end}`
        })
      }
      
      // For upgrades, cancel existing schedule and continue with normal flow
      await stripe.subscriptionSchedules.cancel(subscription.schedule)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const refreshedSubscription = await stripe.subscriptions.retrieve(subscription.id) as any
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
      const currentItems = subscription.items.data.map((item: any) => ({
        price: item.price.id,
        quantity: item.quantity ?? 1,
      }))

      // Use current_period_end from Supabase (convert to Unix timestamp)
      if (!userData.current_period_end) {
        return NextResponse.json(
          { error: 'Mangler periode information for abonnement' },
          { status: 400 }
        )
      }
      
      const endDate = Math.floor(new Date(userData.current_period_end).getTime() / 1000)

      // Create subscription schedule from existing subscription
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
      })

      // Update the schedule with phases
      const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: currentItems,
            start_date: 'now',
            end_date: endDate,
            proration_behavior: 'none',
          },
          {
            items: [{ price: newPriceId, quantity: 1 }],
            start_date: endDate,
            proration_behavior: 'none',
          },
        ],
      })

      return NextResponse.json({
        success: true,
        schedule: updatedSchedule,
        url: `/dashboard?downgraded=${targetPlan}&effective_date=${userData.current_period_end}`
      })
    }
  } catch (error: any) {
    console.error('Error updating subscription:', error)

    return NextResponse.json(
      {
        error: 'Der skete en fejl ved opdatering af abonnement',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
