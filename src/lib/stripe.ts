import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1SCksuFZKXWbK8kLSpayi0jf'
