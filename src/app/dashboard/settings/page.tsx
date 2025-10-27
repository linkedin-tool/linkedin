'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Crown, Calendar, CreditCard, Building2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  current_period_end?: string | null
  next_billing_date?: string | null
  cancel_at_period_end?: boolean | null
  trial_end?: string | null
  subscription_created_at?: string | null
  subscription_canceled_at?: string | null
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState('company')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [creatingPortalSession, setCreatingPortalSession] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams?.get('tab')
    if (tabParam && (tabParam === 'company' || tabParam === 'subscription')) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setUserProfile(profileData)
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
        })
      }

      setLoading(false)
    }

    fetchUserProfile()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Update error:', error)
      setMessage('Der skete en fejl ved opdatering')
    } else {
      setMessage('Indstillinger blev gemt!')
      // Refresh user profile data
      const { data: updatedProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (updatedProfile) {
        setUserProfile(updatedProfile)
      }
    }

    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStripePortal = async () => {
    if (!userProfile?.stripe_customer_id) {
      setMessage('Ingen Stripe kunde ID fundet')
      return
    }

    setCreatingPortalSession(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: userProfile.stripe_customer_id,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      } else {
        setMessage('Fejl ved oprettelse af portal session: ' + data.error)
      }
    } catch (error) {
      console.error('Portal session error:', error)
      setMessage('Der skete en fejl ved adgang til Stripe portal')
    } finally {
      setCreatingPortalSession(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Ikke angivet'
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadgeVariant = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'default' // Green
      case 'trialing':
        return 'outline' // Darker gray with border
      case 'canceled':
      case 'past_due':
      case 'unpaid':
      case 'expired':
        return 'destructive' // Red
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'Aktiv'
      case 'trialing':
        return 'Prøveperiode'
      case 'canceled':
        return 'Opsagt'
      case 'past_due':
        return 'Forfalden'
      case 'unpaid':
        return 'Ubetalt'
      case 'expired':
        return 'Udløbet'
      default:
        return 'Ukendt'
    }
  }

  const getPlanText = (plan: string | null | undefined, status: string | null | undefined) => {
    switch (plan) {
      case 'pro':
        return status === 'canceled' ? 'Pro Plan (Opsagt)' : 'Pro Plan'
      case 'free_trial':
        return 'Gratis Prøveperiode'
      default:
        return 'Ingen plan'
    }
  }

  const getTrialTimeRemaining = (trialEndDate: string | undefined, status: string | undefined) => {
    if (!trialEndDate) return null
    
    // If status is expired, always show as expired regardless of calculated time
    if (status === 'expired') return 'Udløbet'
    
    const now = new Date()
    const trialEnd = new Date(trialEndDate)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Udløbet'
    if (diffDays === 0) return 'Udløber i dag'
    if (diffDays === 1) return 'Udløber i morgen'
    return `Udløber om ${diffDays} dage`
  }

  const handleUpgradeToProClick = async () => {
    if (!userProfile) return
    
    setCreatingPortalSession(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          name: userProfile.name,
          phone: userProfile.phone || '',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`
      } else {
        setMessage('Fejl ved oprettelse af betaling: ' + data.error)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setMessage('Der skete en fejl ved opgradering til Pro')
    } finally {
      setCreatingPortalSession(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'company', label: 'Virksomhed', icon: Building2 },
    { id: 'subscription', label: 'Abonnement', icon: Crown },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Indstillinger</h1>
        <p className="text-gray-600">Administrer dine kontooplysninger og abonnement</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="max-w-4xl">
        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border-0 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Kontooplysninger</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.includes('fejl') 
                      ? 'bg-red-50 border border-red-200 text-red-600' 
                      : 'bg-green-50 border border-green-200 text-green-600'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Navn
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Dit navn"
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email adresse
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="din@email.dk"
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="px-8 h-11 bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Gemmer...' : 'Gem ændringer'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-8 bg-white border-0 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Konto information</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Konto oprettet</span>
                  <span className="text-sm text-gray-900">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('da-DK') : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Bruger ID</span>
                  <span className="text-xs text-gray-500 font-mono">{userProfile?.id}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-8">
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('fejl') 
                  ? 'bg-red-50 border border-red-200 text-red-600' 
                  : 'bg-green-50 border border-green-200 text-green-600'
              }`}>
                {message}
              </div>
            )}
            
            <Card className="p-8 bg-white border-0 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-semibold text-gray-900">Abonnement</h3>
              </div>
              
              <div className="space-y-6">
                {/* Plan Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuværende Plan
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={userProfile?.subscription_plan === 'pro' && userProfile?.subscription_status !== 'canceled' ? 'default' : 'secondary'}
                        className={`text-sm ${
                          userProfile?.subscription_plan === 'pro' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : userProfile?.subscription_plan === 'free_trial' 
                            ? 'bg-blue-100 text-blue-800 border-0' 
                            : ''
                        }`}
                      >
                        {getPlanText(userProfile?.subscription_plan, userProfile?.subscription_status)}
                      </Badge>
                      {userProfile?.subscription_plan === 'pro' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Badge 
                      variant={getStatusBadgeVariant(userProfile?.subscription_status)}
                      className={`text-sm ${
                        userProfile?.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : userProfile?.subscription_status === 'trialing' 
                          ? 'bg-blue-100 text-blue-800 border-0' 
                          : userProfile?.subscription_status === 'canceled'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : userProfile?.subscription_status === 'expired'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : ''
                      }`}
                    >
                      {getStatusText(userProfile?.subscription_status)}
                    </Badge>
                  </div>
                </div>

                {/* Billing Information */}
                {userProfile?.subscription_status === 'active' && !userProfile?.cancel_at_period_end && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4" />
                      Næste trækning
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatDate(userProfile?.next_billing_date)}
                    </div>
                  </div>
                )}

                {userProfile?.cancel_at_period_end && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 mb-2">
                      <Calendar className="h-4 w-4" />
                      Abonnement opsagt
                    </div>
                    <p className="text-sm text-yellow-700">
                      Dit abonnement slutter den {formatDate(userProfile?.current_period_end)}
                    </p>
                    {userProfile?.subscription_canceled_at && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Opsagt den {formatDate(userProfile?.subscription_canceled_at)}
                      </p>
                    )}
                  </div>
                )}

                {userProfile?.subscription_status === 'canceled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-800 mb-2">
                      <Calendar className="h-4 w-4" />
                      Abonnement opsagt
                    </div>
                    <p className="text-sm text-red-700">
                      Dit abonnement er blevet opsagt og er ikke længere aktivt.
                    </p>
                    {userProfile?.subscription_canceled_at && (
                      <p className="text-xs text-red-600 mt-2">
                        Opsagt den {formatDate(userProfile?.subscription_canceled_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Subscription Details */}
                {userProfile?.subscription_created_at && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CreditCard className="h-4 w-4" />
                      Abonnement oprettet
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatDate(userProfile?.subscription_created_at)}
                    </div>
                  </div>
                )}

                {/* Stripe Customer Portal */}
                {userProfile?.stripe_customer_id && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Administrer Abonnement</h4>
                      <p className="text-sm text-gray-600">
                        Administrer dine betalingsoplysninger, se fakturaer, eller opsig dit abonnement.
                      </p>
                      <Button 
                        onClick={handleStripePortal}
                        disabled={creatingPortalSession}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {creatingPortalSession ? 'Opretter...' : 'Åbn Stripe Portal'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Trial expiration info for free trial users */}
                {userProfile?.subscription_plan === 'free_trial' && userProfile?.trial_end && (userProfile?.subscription_status === 'trialing' || userProfile?.subscription_status === 'expired') && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4" />
                      Prøveperiode udløb
                    </div>
                    <div className="text-sm text-gray-900">
                      {getTrialTimeRemaining(userProfile?.trial_end, userProfile?.subscription_status)}
                    </div>
                  </div>
                )}

                {/* Upgrade to Pro button for free trial users */}
                {userProfile?.subscription_plan === 'free_trial' && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Opgradér til Pro</h4>
                      <p className="text-sm text-gray-600">
                        Få fuld adgang til platformen og prioriteret support.
                      </p>
                      <Button 
                        onClick={handleUpgradeToProClick}
                        disabled={creatingPortalSession}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Crown className="h-4 w-4" />
                        {creatingPortalSession ? 'Opretter...' : 'Opgradér til Pro'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
