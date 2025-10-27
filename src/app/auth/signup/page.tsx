'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Check if user is signing up for Pro plan or free trial
  const selectedPlan = searchParams.get('plan')
  const isPro = selectedPlan === 'pro'
  const isFreeTrial = selectedPlan === 'free_trial'

  const handleStripeCheckout = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          phone,
        }),
      })

      const { url, error: apiError } = await response.json()
      
      if (apiError) {
        setError(apiError)
        return
      }
      
      if (url) {
        window.location.href = url
      } else {
        setError('Ingen checkout URL modtaget')
      }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      setError('Der skete en fejl ved oprettelse af betalingssession')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Adgangskoderne matcher ikke')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn')
      setLoading(false)
      return
    }

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Create user record in database with appropriate subscription plan
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            phone,
            subscription_plan: isPro ? 'pro' : 'free_trial',
            subscription_status: isPro ? 'inactive' : 'trialing', // Pro users will get 'active' after Stripe payment
            trial_end: isPro ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now for free trial
          })

        if (userError) {
          console.error('User creation error:', userError)
          setError('Der skete en fejl ved oprettelse af brugerprofil')
          return
        }

        // If Pro plan is selected, redirect to Stripe checkout
        if (isPro) {
          await handleStripeCheckout()
        } else {
          // For free trial, redirect directly to dashboard
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Der skete en fejl ved registrering')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <span className="text-2xl text-gray-900">
              <span style={{fontWeight: 800}}>Basic</span>
              <span style={{fontWeight: 300}}>Platform</span>
            </span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isPro ? 'Opret din Pro konto' : isFreeTrial ? 'Start din gratis prøveperiode' : 'Opret din konto'}
          </h2>
          {isPro && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-center text-sm text-blue-800">
                <strong>Pro Plan valgt</strong> - Du vil blive ført til betaling efter registrering
              </p>
              <p className="text-center text-xs text-blue-600 mt-1">
                299 kr/måned • Alle funktioner • Prioriteret support
              </p>
            </div>
          )}
          {isFreeTrial && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-center text-sm text-green-800">
                <strong>Gratis prøveperiode valgt</strong> - 7 dage gratis adgang
              </p>
              <p className="text-center text-xs text-green-600 mt-1">
                Alle features • Support • Ingen forpligtelser
              </p>
            </div>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Eller{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              log ind på eksisterende konto
            </Link>
          </p>
        </div>
        
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Navn
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="Dit navn"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email adresse
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="din@email.dk"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefonnummer (valgfrit)
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
                placeholder="+45 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Adgangskode
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Mindst 6 tegn"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekræft adgangskode
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="Gentag adgangskode"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Opretter konto...' : 'Opret konto'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-500">
            ← Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
