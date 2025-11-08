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

    // Handle existing schedules - but only if they're actually active
    if (subscription.schedule) {
      try {
        // Check if the schedule is actually active
        const existingSchedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule)
        
        if (existingSchedule.status === 'active') {
          if (upgradeType === 'upgrade') {
            // For upgrades: Release existing schedule (don't cancel subscription) and proceed with immediate upgrade
            console.log('Releasing existing active schedule for immediate upgrade...')
            await stripe.subscriptionSchedules.release(subscription.schedule)
            await new Promise(resolve => setTimeout(resolve, 1000))
            const refreshedSubscription = await stripe.subscriptions.retrieve(subscription.id) as any
            Object.assign(subscription, refreshedSubscription)
          } else {
            // For downgrades: Release existing active schedule and create new one
            console.log('Releasing existing active schedule to create new downgrade schedule...')
            await stripe.subscriptionSchedules.release(subscription.schedule)
            await new Promise(resolve => setTimeout(resolve, 1000))
            const refreshedSubscription = await stripe.subscriptions.retrieve(subscription.id) as any
            Object.assign(subscription, refreshedSubscription)
          }
        } else {
          // Schedule exists but is not active (completed/canceled/released)
          console.log(`Schedule exists but is ${existingSchedule.status}, proceeding with new schedule...`)
        }
      } catch (error) {
        // Schedule might not exist or be accessible, proceed normally
        console.log('Could not retrieve existing schedule, proceeding with new schedule...')
      }
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

      // Get the created schedule to see its current phase
      const createdSchedule = await stripe.subscriptionSchedules.retrieve(schedule.id)
      const currentPhase = createdSchedule.phases[0] // Should be the phase created from subscription
      
      // Update the schedule with phases, preserving the original start_date
      const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: currentItems,
            start_date: currentPhase.start_date, // Use the original start_date from created schedule
            end_date: endDate,
            proration_behavior: 'none',
          },
          {
            items: [{ price: newPriceId, quantity: 1 }],
            proration_behavior: 'none',
          },
        ],
      })

      // Save scheduled downgrade info to Supabase
      await supabase
        .from('users')
        .update({
          scheduled_downgrade_to: targetPlan,
          scheduled_downgrade_date: userData.current_period_end
        })
        .eq('stripe_customer_id', customerId)

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
