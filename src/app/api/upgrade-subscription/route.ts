import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { customerId, targetPlan, upgradeType, quantity } = await request.json()

    if (!customerId || !targetPlan || !upgradeType) {
      return NextResponse.json(
        { error: 'Customer ID, target plan og upgrade type er påkrævet' },
        { status: 400 }
      )
    }

    // Default quantity to 1 for Pro, 3 for Team if not specified
    const finalQuantity = quantity || (targetPlan === 'team' ? 3 : 1)

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
      limit: 10 // Get more to check for duplicates
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'Ingen aktiv subscription fundet' },
        { status: 404 }
      )
    }
    
    // Check for multiple active subscriptions (potential problem)
    if (subscriptions.data.length > 1) {
      console.warn('⚠️ Customer has multiple active subscriptions:', customerId, subscriptions.data.map(s => ({ id: s.id, status: s.status, created: s.created, items: s.items.data.map(i => ({ price: i.price.id, quantity: i.quantity })) })))
      
      // Use the most recent subscription and cancel older duplicates
      subscriptions.data.sort((a, b) => b.created - a.created)
      const olderSubscriptions = subscriptions.data.slice(1)
      
      // Cancel older duplicate subscriptions
      for (const oldSub of olderSubscriptions) {
        try {
          console.log('🗑️ Cancelling duplicate subscription:', oldSub.id)
          await stripe.subscriptions.cancel(oldSub.id)
        } catch (cancelError) {
          console.error('Error cancelling duplicate subscription:', oldSub.id, cancelError)
        }
      }
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
      } catch {
        // Schedule might not exist or be accessible, proceed normally
        console.log('Could not retrieve existing schedule, proceeding with new schedule...')
      }
    }

    if (upgradeType === 'upgrade') {
      // For upgrades, update subscription immediately with proration
      const currentPriceId = subscriptionItem.price.id
      const isSamePlan = currentPriceId === newPriceId
      
      const updateData: any = {
        items: [{
          id: subscriptionItem.id,
          quantity: finalQuantity,
        }],
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'unchanged'
      }
      
      // Only update price if it's actually changing (different plan)
      if (!isSamePlan) {
        updateData.items[0].price = newPriceId
      }
      
      console.log('Updating subscription:', subscription.id, 'Same plan:', isSamePlan, 'Current price:', currentPriceId, 'New price:', newPriceId, 'Quantity:', finalQuantity)
      
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, updateData)

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
            items: [{ price: newPriceId, quantity: finalQuantity }],
            proration_behavior: 'none',
          },
        ],
      })

      // Try to save scheduled downgrade info to Supabase immediately
      // But don't fail if it doesn't work - webhook will handle it as backup
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            scheduled_downgrade_to: targetPlan,
            scheduled_downgrade_date: userData.current_period_end
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('Database update failed, webhook will handle it:', updateError)
        } else {
          console.log('Successfully saved scheduled downgrade to database')
        }
      } catch (dbError) {
        console.error('Database connection failed, webhook will handle it:', dbError)
      }

      // Always return success with URL params as fallback for immediate UI feedback
      return NextResponse.json({
        success: true,
        schedule: updatedSchedule,
        url: `/dashboard?downgraded=${targetPlan}&effective_date=${encodeURIComponent(userData.current_period_end)}&schedule_id=${updatedSchedule.id}`
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
