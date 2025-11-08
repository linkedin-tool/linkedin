import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID, STRIPE_PRICE_ID_TEAM } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', errorMessage)
    return NextResponse.json({ 
      error: 'Webhook signature verification failed',
      details: errorMessage
    }, { status: 400 })
  }

  // Use admin client for webhooks (full database access)
  const supabase = createAdminClient()

  try {
    console.log(`Processing webhook event: ${event.type}`)
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log(`Processing subscription event: ${event.type} for customer: ${(event.data.object as any).customer}`)
        try {
          const subscription = event.data.object as any
          const isNewSubscription = event.type === 'customer.subscription.created'
          
          // Get customer info to find the user
          let customer
          try {
            customer = await stripe.customers.retrieve(subscription.customer)
          } catch (customerError) {
            console.error('Error retrieving customer:', customerError)
            const errorMessage = customerError instanceof Error ? customerError.message : 'Unknown customer error'
            throw new Error(`Failed to retrieve customer ${subscription.customer}: ${errorMessage}`)
          }
          
          // Safely convert timestamps - get from subscription items
          let currentPeriodEnd = null
          let nextBillingDate = null
          
          try {
            // Get current_period_end from the first subscription item
            const subscriptionItem = subscription.items?.data?.[0]
            if (subscriptionItem?.current_period_end && typeof subscriptionItem.current_period_end === 'number') {
              currentPeriodEnd = new Date(subscriptionItem.current_period_end * 1000).toISOString()
              nextBillingDate = new Date(subscriptionItem.current_period_end * 1000).toISOString()
            }
          } catch (dateError) {
            console.error('Error converting dates:', dateError)
          }

          // Determine subscription plan based on price ID
          let subscriptionPlan = 'pro' // default
          const subscriptionItem = subscription.items?.data?.[0]
          if (subscriptionItem?.price?.id) {
            if (subscriptionItem.price.id === STRIPE_PRICE_ID_TEAM) {
              subscriptionPlan = 'team'
            } else if (subscriptionItem.price.id === STRIPE_PRICE_ID) {
              subscriptionPlan = 'pro'
            }
          }

          // First get current user data to check if plan actually changed
          const { data: currentUser } = await supabase
            .from('users')
            .select('subscription_plan, scheduled_downgrade_to, scheduled_downgrade_date')
            .eq('stripe_customer_id', subscription.customer)
            .single()

          // Check if scheduled downgrade should be cleared
          const planChanged = currentUser && currentUser.subscription_plan !== subscriptionPlan
          const planChangeDowngrade = planChanged && currentUser.scheduled_downgrade_to
          
          // Check if schedule was cancelled (schedule went from existing to null)
          const previousSchedule = event.data.previous_attributes?.schedule
          const currentSchedule = subscription.schedule
          const scheduleCancelled = previousSchedule && !currentSchedule && currentUser?.scheduled_downgrade_to
          
          const shouldClearScheduledDowngrade = planChangeDowngrade || scheduleCancelled

          const updateData = {
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: currentPeriodEnd,
            next_billing_date: nextBillingDate,
            cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at ? true : false,
            subscription_plan: subscriptionPlan,
            // Handle scheduled downgrade info - clear if needed, preserve if not
            scheduled_downgrade_to: shouldClearScheduledDowngrade ? null : currentUser?.scheduled_downgrade_to,
            scheduled_downgrade_date: shouldClearScheduledDowngrade ? null : currentUser?.scheduled_downgrade_date,
            // Only set subscription_created_at for new subscriptions
            ...(isNewSubscription && subscription.created && {
              subscription_created_at: new Date(subscription.created * 1000).toISOString()
            }),
            // Set subscription_canceled_at when cancel_at_period_end becomes true OR cancel_at is set
            ...((subscription.cancel_at_period_end || subscription.cancel_at) && !isNewSubscription && {
              subscription_canceled_at: new Date().toISOString()
            })
          }

          if (shouldClearScheduledDowngrade) {
            if (planChangeDowngrade) {
              console.log('Plan changed from', currentUser?.subscription_plan, 'to', subscriptionPlan, '- clearing scheduled downgrade')
            } else if (scheduleCancelled) {
              console.log('Schedule cancelled (', previousSchedule, '→ null) - clearing scheduled downgrade from database')
            }
          } else {
            console.log('Plan unchanged and no schedule cancellation - preserving scheduled downgrade info')
          }
          
          console.log('Webhook update data:', updateData)
          console.log('Subscription details:', {
            id: subscription.id,
            customer: subscription.customer,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at,
            canceled_at: subscription.canceled_at,
            current_period_end: subscription.current_period_end
          })
          console.log('Looking for user with stripe_customer_id:', subscription.customer)
          
          // First try to update by stripe_customer_id
          const { error, count } = await supabase
            .from('users')
            .update(updateData)
            .eq('stripe_customer_id', subscription.customer)
            
          console.log('Update result - count:', count, 'error:', error)
          
          // If no rows affected and we have customer email, try by email
          const customerEmail = customer && !customer.deleted ? customer.email : null
          if ((!count || count === 0) && customerEmail) {
            console.log('No user found by stripe_customer_id, trying by email:', customerEmail)
            const { error: emailError, count: emailCount } = await supabase
              .from('users')
              .update(updateData)
              .eq('email', customerEmail)
              
            console.log('Email update result - count:', emailCount, 'error:', emailError)
              
            if (emailError) {
              console.error('Error updating subscription by email:', emailError)
              throw new Error(`Failed to update user by email: ${emailError.message}`)
            }
          } else if (error) {
            console.error('Error updating subscription by customer_id:', error)
            throw new Error(`Failed to update user by customer_id: ${error.message}`)
          }
        } catch (subscriptionError) {
          console.error('Error in subscription webhook handler:', subscriptionError)
          throw subscriptionError
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        
        // Get cancellation timestamp from Stripe
        let subscriptionCanceledAt = null
        if (subscription.canceled_at && typeof subscription.canceled_at === 'number') {
          subscriptionCanceledAt = new Date(subscription.canceled_at * 1000).toISOString()
        }
        
        // Update user record when subscription is cancelled
        // Keep subscription_plan as 'pro' - users who had Pro don't revert to free_trial
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            // subscription_plan stays 'pro' - don't downgrade to 'free_trial'
            stripe_subscription_id: null,
            current_period_end: null,
            next_billing_date: null,
            cancel_at_period_end: false,
            subscription_canceled_at: subscriptionCanceledAt,
          })
          .eq('stripe_customer_id', subscription.customer)

        if (error) {
          console.error('Error updating cancelled subscription:', error)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        
        // Update subscription status on successful payment
        if (invoice.subscription) {
          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: 'active',
            })
            .eq('stripe_subscription_id', invoice.subscription)

          if (error) {
            console.error('Error updating payment success:', error)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        
        // Update subscription status on failed payment
        if (invoice.subscription) {
          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription)

          if (error) {
            console.error('Error updating payment failure:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      eventType: event.type,
      eventId: event.id
    })
    
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: errorMessage,
      eventType: event.type,
      eventId: event.id
    }, { status: 500 })
  }
}
