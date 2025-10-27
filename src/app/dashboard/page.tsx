'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  TrendingUp, 
  Crown, 
  Calendar,
  CheckCircle,
  X
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  trial_end?: string | null
  created_at: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

// Dummy data for demonstration
const dummyStats = {
  totalUsers: 1247,
  activeSubscriptions: 892,
  monthlyRevenue: 267340,
  conversionRate: 71.5
}

const dummyRecentActivity = [
  {
    id: 1,
    type: 'user_signup',
    description: 'Ny bruger registreret',
    user: 'Anders Hansen',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    type: 'subscription_upgrade',
    description: 'Opgraderet til Pro',
    user: 'Maria Larsen',
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: 3,
    type: 'payment_success',
    description: 'Betaling gennemført',
    user: 'Peter Nielsen',
    timestamp: '2024-01-15T08:45:00Z'
  }
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  
  useEffect(() => {
    const welcome = searchParams.get('welcome')
    const plan = searchParams.get('plan')
    if (welcome && plan === 'pro') {
      setShowWelcome(true)
    }
  }, [searchParams])
  
  useEffect(() => {
    const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setUserProfile(profileData)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setLoading(false)
    }
    }
    
    fetchUserProfile()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const timeString = date.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    if (activityDate.getTime() === today.getTime()) {
      return `I dag ${timeString}`
    } else if (activityDate.getTime() === yesterday.getTime()) {
      return `I går ${timeString}`
    } else {
      return `${date.toLocaleDateString('da-DK', {
        day: 'numeric',
        month: 'short'
      })} ${timeString}`
    }
  }

  const getTrialTimeRemaining = (trialEndDate: string | null | undefined, status: string | null | undefined) => {
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome message for Pro users */}
      {showWelcome && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Velkommen til Basic Platform Pro! 🎉
                </h3>
                <p className="text-gray-700 mt-1">
                  Dit Pro abonnement er nu aktivt. Du har adgang til alle premium funktioner.
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowWelcome(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Trial Status for Free Trial Users */}
      {userProfile?.subscription_plan === 'free_trial' && userProfile?.trial_end && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Gratis prøveperiode aktiv
                </h3>
                <p className="text-gray-700 mt-1">
                  {getTrialTimeRemaining(userProfile.trial_end, userProfile.subscription_status)}
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings?tab=subscription">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Opgradér til Pro
              </Button>
            </Link>
          </div>
        </Card>
      )}
      
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Overblik</h1>
        <p className="text-lg text-gray-600">Velkommen tilbage, {userProfile?.name || 'Bruger'}!</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Samlede brugere</p>
              <p className="text-3xl font-bold text-gray-900">{dummyStats.totalUsers.toLocaleString('da-DK')}</p>
              <p className="text-sm text-gray-500 mt-1">
                +12% fra sidste måned
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Active Subscriptions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive abonnementer</p>
              <p className="text-3xl font-bold text-gray-900">{dummyStats.activeSubscriptions.toLocaleString('da-DK')}</p>
              <p className="text-sm text-gray-500 mt-1">
                +8% fra sidste måned
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Månedlig omsætning</p>
              <p className="text-3xl font-bold text-gray-900">{(dummyStats.monthlyRevenue / 1000).toFixed(0)}k kr</p>
              <p className="text-sm text-gray-500 mt-1">
                +15% fra sidste måned
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Konverteringsrate</p>
              <p className="text-3xl font-bold text-gray-900">{dummyStats.conversionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">
                +3% fra sidste måned
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Seneste aktivitet</h3>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="space-y-4">
            {dummyRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.type === 'user_signup' && <Users className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'subscription_upgrade' && <Crown className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'payment_success' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Hurtige handlinger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/settings" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Administrer konto</h4>
                <p className="text-sm text-gray-600">Opdater dine kontooplysninger og indstillinger</p>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/settings?tab=subscription" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Abonnement</h4>
                <p className="text-sm text-gray-600">Se og administrer dit abonnement</p>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <a href="mailto:support@basicplatform.dk" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Få hjælp</h4>
                <p className="text-sm text-gray-600">Kontakt vores support team</p>
              </div>
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
