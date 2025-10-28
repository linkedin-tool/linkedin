'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { 
  CheckCircle, 
  Check,
  ArrowRight,
  Zap,
  Shield,
  Crown
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string
  email: string
  subscription_plan?: string | null
  subscription_status?: string | null
  stripe_customer_id?: string | null
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingCheckout, setCreatingCheckout] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get user profile to check subscription status
        const { data: profileData } = await supabase
          .from('users')
          .select('id, name, email, subscription_plan, subscription_status, stripe_customer_id')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profileData)
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const handleProClick = async () => {
    if (!user || !userProfile) {
      // Not logged in - go to signup
      window.location.href = '/auth/signup?plan=pro'
      return
    }

    // User is logged in - check subscription status
    if (userProfile.subscription_status === 'active') {
      alert('Du har allerede et gyldigt abonnement!')
      return
    }

    // User has canceled/no subscription - create checkout session directly
    setCreatingCheckout(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          name: userProfile.name,
          phone: '',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`
      } else {
        alert('Fejl ved oprettelse af betaling: ' + data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Der skete en fejl ved oprettelse af betaling')
    } finally {
      setCreatingCheckout(false)
    }
  }

  const getProButtonText = () => {
    if (loading) return 'Indlæser...'
    if (creatingCheckout) return 'Opretter betaling...'
    if (!user) return 'Vælg Pro'
    if (userProfile?.subscription_status === 'active') return 'Du har allerede Pro'
    return 'Genaktiver Pro'
  }

  const isProButtonDisabled = (): boolean => {
    return loading || creatingCheckout || (user !== null && userProfile?.subscription_status === 'active')
  }

  const handleFreeTrialClick = async () => {
    if (!user) {
      // Not logged in - go to signup for free trial
      window.location.href = '/auth/signup?plan=free_trial'
      return
    }

    // User is already logged in - they already have access
    if (userProfile) {
      // Redirect to dashboard since they're already signed up
      window.location.href = '/dashboard'
    }
  }

  const getFreeTrialButtonText = () => {
    if (loading) return 'Indlæser...'
    if (!user) return 'Start gratis'
    return 'Gå til dashboard'
  }

  return (
    <>
      <div className="flex-1 bg-white">
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-12 md:py-20 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-base font-medium mb-6">
                🚀 Simpel platform til abonnementer
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Administrer dine <span className="text-blue-600">abonnementer</span> nemt og sikkert
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                En simpel og kraftfuld platform til at håndtere brugerregistrering, betalinger og abonnementer.<br />
                <span className="font-semibold text-gray-900">Alt hvad du behøver for at komme i gang.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-900 hover:to-blue-800 shadow-lg rounded-full  transition-all duration-200"
                  onClick={handleFreeTrialClick}
                  disabled={loading}
                >
                  {getFreeTrialButtonText()}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              <p className="text-base text-gray-500 mt-4">
                Ingen kreditkort påkrævet • 7 dages gratis prøveperiode
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Alt hvad du behøver
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                En komplet løsning til brugeradministration og abonnementshåndtering
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 ">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Hurtig opsætning
                </h3>
                <p className="text-gray-600">
                  Kom i gang på få minutter med brugerregistrering, login og dashboard funktionalitet.
                </p>
              </Card>
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 ">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Sikre betalinger
                </h3>
                <p className="text-gray-600">
                  Integreret med Stripe for sikre betalinger og automatisk abonnementshåndtering.
                </p>
              </Card>
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 ">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Komplet dashboard
                </h3>
                <p className="text-gray-600">
                  Administrer brugere, abonnementer og indstillinger fra et intuitivt dashboard.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vælg den plan der passer til dig
              </h2>
              <p className="text-xl text-gray-600">
                Prøv gratis i 7 dage - ingen binding eller skjulte omkostninger
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-8 bg-white border border-gray-100 rounded-3xl transition-shadow duration-300 relative flex flex-col" style={{boxShadow: '0 -5px 15px -3px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratis prøveperiode</h3>
                  <p className="text-gray-600 mb-6">Prøv det helt gratis i 7 dage</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">0 kr</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Alle Pro funktioner i 7 dage</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Komplet dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Stripe integration</span>
          </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Ingen forpligtelser</span>
          </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white rounded-full font-semibold py-6  transition-all duration-200" 
                    onClick={handleFreeTrialClick}
                    disabled={loading || !!user}
                  >
                    {getFreeTrialButtonText()}
                  </Button>
                </div>
              </Card>
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl transition-shadow duration-300 relative flex flex-col" style={{boxShadow: '0 -5px 15px -3px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-6">Fuld adgang til platformen</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">299 kr</span>
                    <span className="text-gray-600">/måned</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Ubegrænset brugere</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Avanceret dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Prioriteret support</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Alle fremtidige features</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white rounded-full font-semibold py-6 shadow-lg  transition-all duration-200" 
                    onClick={handleProClick}
                    disabled={isProButtonDisabled()}
                  >
                    {getProButtonText()}
                  </Button>
                </div>
              </Card>
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-600">
                <Shield className="w-5 h-5 inline mr-2" />
                Kom i gang på under 2 minutter • Ingen kreditkort påkrævet • Opsig når som helst
              </p>
            </div>
        </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Klar til at komme i gang?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Opret din konto i dag og få adgang til alle funktioner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-4 bg-white text-blue-800 hover:bg-blue-50 rounded-full font-semibold  transition-all duration-200 shadow-lg"
                onClick={handleFreeTrialClick}
                disabled={loading}
              >
                {getFreeTrialButtonText()}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
    </div>

      <Footer />
    </>
  )
}