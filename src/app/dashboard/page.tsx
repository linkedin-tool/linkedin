'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  FileText, 
  TrendingUp, 
  Crown, 
  Calendar,
  X,
  PlusCircle,
  Clock,
  BarChart3,
  Building2
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  trial_end?: string | null
  created_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  scheduled_downgrade_to?: string | null
  scheduled_downgrade_date?: string | null
}

interface LinkedInPost {
  id: string
  text: string
  status: string
  scheduled_for: string | null
  published_at: string | null
  created_at: string
  image_url: string | null
  visibility: string
}

interface LinkedInStats {
  totalPosts: number
  scheduledPosts: number
  publishedThisMonth: number
}


function DashboardContent() {
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkedinStats, setLinkedinStats] = useState<LinkedInStats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedThisMonth: 0
  })
  const [recentPosts, setRecentPosts] = useState<LinkedInPost[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<LinkedInPost[]>([])
  
  const supabase = createClient()

  // Standardiserede styling funktioner.
  const getVisibilityStyle = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'bg-blue-100 text-blue-800';
      case 'CONNECTIONS':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Offentligt';
      case 'CONNECTIONS':
        return 'Kun forbindelser';
      default:
        return visibility;
    }
  };
  
  useEffect(() => {
    const welcome = searchParams.get('welcome')
    const plan = searchParams.get('plan')
    const upgraded = searchParams.get('upgraded')
    const downgraded = searchParams.get('downgraded')
    
    // Show welcome for new subscriptions, upgrades, or downgrades
    if ((welcome && (plan === 'pro' || plan === 'team')) || 
        (upgraded === 'team' || upgraded === 'pro') ||
        (downgraded === 'pro' || downgraded === 'team')) {
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

  useEffect(() => {
    const fetchLinkedInData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch all posts
        const { data: posts } = await supabase
          .from('linkedin_posts' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (posts) {
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          
          const postsData = posts as any[]
          const scheduledPosts = postsData.filter(post => post.status === 'scheduled')
          const publishedThisMonth = postsData.filter(post => 
            post.status === 'published' && 
            post.published_at && 
            new Date(post.published_at) >= startOfMonth
          )
          
          setLinkedinStats({
            totalPosts: postsData.length,
            scheduledPosts: scheduledPosts.length,
            publishedThisMonth: publishedThisMonth.length
          })

          // Recent posts (last 5 published)
          const recentPublished = postsData
            .filter(post => post.status === 'published')
            .slice(0, 5)
          setRecentPosts(recentPublished)

          // Upcoming posts (next 5 scheduled)
          const upcoming = postsData
            .filter(post => post.status === 'scheduled' && post.scheduled_for)
            .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())
            .slice(0, 5)
          setUpcomingPosts(upcoming)
        }

        // LinkedIn connection status is handled by individual components when needed

      } catch (error) {
        console.error('Error fetching LinkedIn data:', error)
      }
    }

    fetchLinkedInData()
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
        <Card className={`p-6 bg-gradient-to-r ${userProfile?.subscription_plan === 'team' ? 'from-purple-50 to-purple-100 border-purple-200' : 'from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${userProfile?.subscription_plan === 'team' ? 'bg-purple-600' : 'bg-blue-600'} rounded-full flex items-center justify-center`}>
                {userProfile?.subscription_plan === 'team' ? (
                  <Building2 className="w-6 h-6 text-white" />
                ) : (
                  <Crown className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                {(() => {
                  // Check both database and URL params for scheduled downgrade
                  // URL params provide immediate feedback, database provides persistence
                  let targetPlan = userProfile?.scheduled_downgrade_to
                  let effectiveDate = userProfile?.scheduled_downgrade_date
                  let isFromUrl = false
                  
                  // If no database data, or if we have fresh URL params, use URL params
                  const downgraded = searchParams.get('downgraded')
                  const urlEffectiveDate = searchParams.get('effective_date')
                  const scheduleId = searchParams.get('schedule_id')
                  
                  if (downgraded && urlEffectiveDate) {
                    // Use URL params if we don't have database data, or if this is a fresh schedule
                    if (!targetPlan || !effectiveDate || scheduleId) {
                      targetPlan = downgraded
                      effectiveDate = urlEffectiveDate
                      isFromUrl = true
                    }
                  }
                  
                  const upgraded = searchParams.get('upgraded')
                  
                  if (targetPlan && effectiveDate) {
                    const targetPlanText = targetPlan === 'pro' ? 'Pro' : 'Team'
                    
                    // Safely parse the date
                    let date = 'Invalid Date'
                    try {
                      const parsedDate = new Date(effectiveDate)
                      if (!isNaN(parsedDate.getTime())) {
                        date = parsedDate.toLocaleDateString('da-DK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }
                    } catch (error) {
                      console.error('Error parsing effective date:', effectiveDate, error)
                    }
                    return (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">
                          Nedgradering planlagt til {targetPlanText} 📅
                        </h3>
                        <p className="text-gray-700 mt-1">
                          Du beholder dine {userProfile?.subscription_plan === 'team' ? 'Team' : 'Pro'} rettigheder til {date}. Derefter skifter du til {targetPlanText} plan.
                          {isFromUrl && (
                            <span className="text-xs text-blue-600 block mt-1">
                              ⏳ Bekræftelse behandles...
                            </span>
                          )}
                        </p>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">
                          Velkommen til Nolia {userProfile?.subscription_plan === 'team' ? 'Team' : 'Pro'}! 🎉
                        </h3>
                        <p className="text-gray-700 mt-1">
                          Dit {userProfile?.subscription_plan === 'team' ? 'Team' : 'Pro'} abonnement er nu aktivt. Du har adgang til alle {userProfile?.subscription_plan === 'team' ? 'Team funktioner og kan nu oprette team medlemmer' : 'premium funktioner'}.
                        </p>
                      </>
                    )
                  }
                })()}
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
        {/* Total Posts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Samlede opslag</p>
              <p className="text-3xl font-bold text-gray-900">{linkedinStats.totalPosts}</p>
              <p className="text-sm text-gray-500 mt-1">
                Alle opslag oprettet
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Scheduled Posts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planlagte opslag</p>
              <p className="text-3xl font-bold text-gray-900">{linkedinStats.scheduledPosts}</p>
              <p className="text-sm text-gray-500 mt-1">
                Afventer udgivelse
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Published This Month */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Udgivet denne måned</p>
              <p className="text-3xl font-bold text-gray-900">{linkedinStats.publishedThisMonth}</p>
              <p className="text-sm text-gray-500 mt-1">
                Opslag på LinkedIn
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hurtige handlinger</p>
              <p className="text-3xl font-bold text-gray-900">⚡</p>
              <p className="text-sm text-gray-500 mt-1">
                Opret nyt indhold
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <PlusCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Seneste opslag</h3>
          </div>
          <Link href="/dashboard/mine-opslag">
            <Button variant="outline" size="sm">
              Se alle
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <Card key={post.id} className="p-3 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt="Opslag billede"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {post.text.length > 60 ? `${post.text.substring(0, 60)}...` : post.text}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisibilityStyle(post.visibility)}`}>
                            {getVisibilityText(post.visibility)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm text-gray-500">
                      {post.published_at
                        ? formatDate(post.published_at)
                        : formatDate(post.created_at)
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Ingen opslag endnu</p>
              <p className="text-sm text-gray-400 mt-1">Opret dit første opslag for at se aktivitet her</p>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Hurtige handlinger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/new-post" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Opret nyt opslag</h4>
                <p className="text-sm text-gray-600">Skriv og udgiv dit næste LinkedIn opslag</p>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/content-plan" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Content Plan</h4>
                <p className="text-sm text-gray-600">Se din indholdskalender og planlagte opslag</p>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/ny-ide" className="block">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Ny Idé
                </h4>
                <p className="text-sm text-gray-600">
                  Opret en ny idé til dit indhold
                </p>
              </div>
            </Link>
          </Card>
        </div>
      </div>

      {/* Upcoming Scheduled Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Kommende planlagte opslag</h3>
          </div>
          <Link href="/dashboard/content-plan">
            <Button variant="outline" size="sm">
              Se kalender
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {upcomingPosts.length > 0 ? (
            upcomingPosts.map((post) => (
              <Card key={post.id} className="p-3 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt="Opslag billede"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {post.text.length > 60 ? `${post.text.substring(0, 60)}...` : post.text}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisibilityStyle(post.visibility)}`}>
                            {getVisibilityText(post.visibility)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm text-gray-500">
                      {post.scheduled_for && formatDate(post.scheduled_for)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Ingen planlagte opslag</p>
              <p className="text-sm text-gray-400 mt-1">Planlæg dit næste opslag for at se det her</p>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Spacer */}
      <div className="h-20"></div>
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
