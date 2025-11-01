'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { 
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CalendarClock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CronJobRun {
  jobid?: number
  runid?: bigint
  run_time: string
  status: string
  total_posts?: number
  successful_posts?: number
  failed_posts?: number
  execution_time_ms?: number
  failures?: any
  cron_start_time?: string
  cron_end_time?: string | null
  return_message?: string | null
  error_message?: string | null
  window_start?: string
  window_end?: string
}

interface QueueStats {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastRun: string | null
  lastRunStatus: string | null
  runsLast24Hours: number
  successRate: number
  averageDuration: number | null
}

interface DailyKpis {
  postsScheduledToday: number
  postsPublishedToday: number
  postsScheduledNext24Hours: number
  totalScheduledPosts: number
}

export default function QueuePage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState<QueueStats>({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    lastRun: null,
    lastRunStatus: null,
    runsLast24Hours: 0,
    successRate: 0,
    averageDuration: null
  })
  const [dailyKpis, setDailyKpis] = useState<DailyKpis>({
    postsScheduledToday: 0,
    postsPublishedToday: 0,
    postsScheduledNext24Hours: 0,
    totalScheduledPosts: 0
  })
  const [recentRuns, setRecentRuns] = useState<CronJobRun[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<Array<{
    scheduled_for: string;
    post_count: number;
    time_label: string;
  }>>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch user profile to check admin status
        const { data: profileData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setIsAdmin(profileData.is_admin || false)
          
          // If not admin, redirect to dashboard
          if (!profileData.is_admin) {
            router.push('/dashboard')
            return
          }
        } else {
          // If no profile found, assume not admin
          setIsAdmin(false)
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
        router.push('/dashboard')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAdminStatus()
  }, [supabase, router])

  const fetchQueueData = async () => {
    try {
      const response = await fetch('/api/queue/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue status')
      }

      const data = await response.json()

      if (data.error) {
        console.error('Error from API:', data.error)
        setLoading(false)
        return
      }

      // Set stats from API response
      setStats(data.stats || {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRun: null,
        lastRunStatus: null,
        runsLast24Hours: 0,
        successRate: 0,
        averageDuration: null
      })

      // Set daily KPIs from API response
      setDailyKpis(data.dailyKpis || {
        postsScheduledToday: 0,
        postsPublishedToday: 0,
        postsScheduledNext24Hours: 0,
        totalScheduledPosts: 0
      })

      // Set recent runs from API response
      setRecentRuns((data.recentRuns || []).map((run: any) => ({
        run_time: run.run_time || run.cron_start_time || '',
        status: run.status || 'unknown',
        total_posts: run.total_posts || 0,
        successful_posts: run.successful_posts || 0,
        failed_posts: run.failed_posts || 0,
        execution_time_ms: run.execution_time_ms || null,
        failures: run.failures || null,
        cron_start_time: run.cron_start_time,
        cron_end_time: run.cron_end_time || null,
        return_message: run.return_message || null
      })) as CronJobRun[])

      // Set upcoming posts from API response
      setUpcomingPosts((data.upcomingPosts || []) as Array<{
        scheduled_for: string;
        post_count: number;
        time_label: string;
      }>)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching queue data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch data if user is confirmed admin
    if (isAdmin === true && !authLoading) {
      fetchQueueData()

      // Auto-refresh every 30 seconds if enabled
      let interval: NodeJS.Timeout | null = null
      if (autoRefresh) {
        interval = setInterval(() => {
          fetchQueueData()
        }, 30000) // 30 seconds
      }

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [autoRefresh, isAdmin, authLoading])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return 'Fuldført'
      case 'failed':
        return 'Fejlet'
      case 'error':
        return 'Fejl'
      case 'running':
        return 'Kører'
      default:
        return status
    }
  }

  const formatDuration = (executionTimeMs: number | null | undefined, startTime?: string, endTime?: string | null) => {
    if (executionTimeMs !== null && executionTimeMs !== undefined) {
      if (executionTimeMs < 1000) return `${executionTimeMs}ms`
      return `${(executionTimeMs / 1000).toFixed(2)}s`
    }
    if (startTime && endTime) {
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      const duration = (end - start) / 1000 // seconds
      
      if (duration < 1) return `${Math.round(duration * 1000)}ms`
      if (duration < 60) return `${Math.round(duration)}s`
      return `${Math.round(duration / 60)}m ${Math.round(duration % 60)}s`
    }
    return 'Kører...'
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Copenhagen'
    }).format(date)
  }

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('da-DK', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Copenhagen'
    }).format(date)
  }

  // Show loading while checking admin status
  if (authLoading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Kontrollerer adgang...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Adgang Nægtet</h2>
          <p className="text-gray-600 mb-4">Du har ikke tilladelse til at tilgå denne side.</p>
          <p className="text-sm text-gray-500">Kun administratorer kan se queue status.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pt-16">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Queue Status</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-blue-50' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-opdater' : 'Manuel opdatering'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchQueueData()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Opdater nu
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Overblik over automatisk udgivelse af planlagte LinkedIn opslag
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Planlagt I Dag</h3>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{dailyKpis.postsScheduledToday}</p>
                <p className="text-sm text-gray-500 mt-1">
                  opslag skal udgives i dag
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Udgivet I Dag</h3>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{dailyKpis.postsPublishedToday}</p>
                <p className="text-sm text-gray-500 mt-1">
                  opslag udgivet i dag
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Næste 24 Timer</h3>
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600">{dailyKpis.postsScheduledNext24Hours}</p>
                <p className="text-sm text-gray-500 mt-1">
                  opslag kommer snart
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Planlagt</h3>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{dailyKpis.totalScheduledPosts}</p>
                <p className="text-sm text-gray-500 mt-1">
                  opslag i kø
                </p>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Gennemsnitlig Varighed</h3>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageDuration !== null
                    ? stats.averageDuration < 1000
                      ? `${Math.round(stats.averageDuration)}ms`
                      : `${(stats.averageDuration / 1000).toFixed(2)}s`
                    : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Baseret på {stats.successfulRuns} godkendte kørsler
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Status</h3>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                {stats.lastRun ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(stats.lastRun).getTime() > Date.now() - 120000
                        ? 'Kører aktivt'
                        : 'Venter på næste kørsel'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Næste kørsel: Om {60 - (new Date().getSeconds())} sekunder
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-400">Ingen aktivitet</p>
                )}
              </Card>
            </div>

            {/* Upcoming Posts Section */}
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Kommende Planlagte Opslag</h2>
                <CalendarClock className="w-5 h-5 text-gray-600" />
              </div>
              
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Ingen kommende planlagte opslag</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Når du planlægger opslag, vil de blive vist her.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dato</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tidspunkt</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Antal Opslag</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingPosts.map((item, index) => {
                        const scheduledDate = new Date(item.scheduled_for);
                        const isToday = scheduledDate.toDateString() === new Date().toDateString();
                        const isTomorrow = scheduledDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        const isWithinHour = (scheduledDate.getTime() - Date.now()) < 3600000; // Within 1 hour
                        
                        return (
                          <tr key={item.scheduled_for || index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {isToday 
                                ? 'I dag' 
                                : isTomorrow 
                                  ? 'I morgen' 
                                  : formatDateTime(item.scheduled_for).split(',')[0]}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {formatTimeOnly(item.scheduled_for)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-600">
                                  {item.post_count}
                                </span>
                                <span className="text-gray-600">
                                  {item.post_count === 1 ? 'opslag' : 'opslag'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isWithinHour 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {isWithinHour ? 'Snart' : 'Planlagt'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Recent Runs Table */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Seneste Kørsler</h2>
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              
              {recentRuns.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Ingen kørsler fundet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Cron jobbet har ikke kørt endnu, eller der er ikke nogen data at vise.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kørselstid</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Opslag</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Udgivet</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fejlet</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Varighed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRuns.map((run, index) => (
                        <tr key={run.run_time || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(run.status)}
                              <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(run.status)}`}>
                                {getStatusText(run.status)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {formatDateTime(run.run_time || run.cron_start_time || '')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {run.total_posts !== undefined && run.total_posts > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{run.total_posts}</span>
                                <span className="text-gray-400">opslag</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {run.successful_posts !== undefined && run.successful_posts > 0 ? (
                              <span className="text-green-600 font-medium">
                                {run.successful_posts}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {run.failed_posts !== undefined && run.failed_posts > 0 ? (
                              <div className="space-y-1">
                                <span className="text-red-600 font-medium">
                                  {run.failed_posts}
                                </span>
                                {run.error_message && (
                                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-xs truncate" title={run.error_message}>
                                    {run.error_message}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {formatDuration(run.execution_time_ms, run.cron_start_time, run.cron_end_time)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
