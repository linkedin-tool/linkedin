import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_session`)
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    })

    if (!session.customer || !session.subscription) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_session`)
    }

    const customer = session.customer as unknown as Record<string, unknown>

    // Get customer info from metadata
    const email = session.metadata?.customer_email || (customer.email as string)
    const name = session.metadata?.customer_name || (customer.name as string)

    if (!email || !name) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_customer_info`)
    }

    const supabase = await createClient()
    
    // Update user with Stripe customer ID so webhook can find them
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: customer.id as string,
      })
      .eq('email', email)

    if (updateError) {
      console.error('Error updating user with stripe_customer_id:', updateError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=update_failed`)
    }

    if (session.payment_status === 'paid') {
      // Redirect to dashboard with success message
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?welcome=true&plan=pro`)
    } else {
      // Payment not completed
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=payment_incomplete`)
    }
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=session_error`)
  }
}
