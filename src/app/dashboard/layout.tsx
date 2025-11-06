'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Settings, 
  ExternalLink,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Link as LinkIcon,
  FileText,
  Calendar,
  Activity,
  Brain,
  Lightbulb,
  Plus,
  Bell,
  FileImage
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { LinkedInNotificationBanner } from '@/components/LinkedInNotificationBanner'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string | null
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
  is_admin?: boolean | null
}

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  action_url?: string
  created_at: string
  updated_at: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationLimit, setNotificationLimit] = useState(20)
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const createDropdownRef = useRef<HTMLDivElement>(null)
  const notificationsDropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = async (userId: string, limit = notificationLimit, append = false) => {
    const { data: notificationsData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1) as { data: Notification[] | null } // Fetch one extra to check if there are more

    if (notificationsData) {
      const hasMore = notificationsData.length > limit
      const actualData = hasMore ? notificationsData.slice(0, limit) : notificationsData
      
      if (append) {
        setNotifications(prev => [...prev, ...actualData])
      } else {
        setNotifications(actualData)
        const unread = actualData.filter(n => !n.is_read).length
        setUnreadCount(unread)
      }
      
      setHasMoreNotifications(hasMore)
    }
  }

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (!userProfile) return
    
    const currentCount = notifications.length
    const { data: moreNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .range(currentCount, currentCount + 9) // Load 10 more
      .limit(11) as { data: Notification[] | null } // Fetch one extra to check if there are more

    if (moreNotifications) {
      const hasMore = moreNotifications.length > 10
      const actualData = hasMore ? moreNotifications.slice(0, 10) : moreNotifications
      
      setNotifications(prev => [...prev, ...actualData])
      setHasMoreNotifications(hasMore)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userProfile) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userProfile.id)
      .eq('is_read', false)

    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    )
    setUnreadCount(0)
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile data
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setUserProfile(profileData)
      }

      // Fetch notifications
      await fetchNotifications(user.id)

      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setCreateDropdownOpen(false)
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsDropdownOpen(false)
      }
    }

    if (userDropdownOpen || createDropdownOpen || notificationsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen, createDropdownOpen, notificationsDropdownOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser...</p>
        </div>
      </div>
    )
  }

  // Main functional pages
  const mainNavigation = [
    { 
      name: 'Overblik', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      current: pathname === '/dashboard' 
    },
    { 
      name: 'Content Plan', 
      href: '/dashboard/content-plan', 
      icon: Calendar,
      current: pathname === '/dashboard/content-plan' 
    },
    { 
      name: 'Mine Opslag', 
      href: '/dashboard/mine-opslag', 
      icon: FileText,
      current: pathname === '/dashboard/mine-opslag' 
    },
    { 
      name: 'Idé Bank', 
      href: '/dashboard/idebank', 
      icon: Lightbulb,
      current: pathname === '/dashboard/idebank' 
    },
    { 
      name: 'PDF Generator', 
      href: '/dashboard/pdf-generator', 
      icon: FileImage,
      current: pathname === '/dashboard/pdf-generator' 
    },
    { 
      name: 'Træn din AI', 
      href: '/dashboard/train-ai', 
      icon: Brain,
      current: pathname === '/dashboard/train-ai' 
    },
  ]

  // Admin-only Queue item
  const queueNavigation = userProfile?.is_admin 
    ? [{ 
        name: 'Queue', 
        href: '/dashboard/queue', 
        icon: Activity,
        current: pathname === '/dashboard/queue' 
      }]
    : []

  // Settings pages
  const settingsNavigation = [
    { 
      name: 'Integration', 
      href: '/dashboard/integration', 
      icon: LinkIcon,
      current: pathname === '/dashboard/integration' 
    },
    { 
      name: 'Indstillinger', 
      href: '/dashboard/settings', 
      icon: Settings,
      current: pathname === '/dashboard/settings' 
    },
  ]

  // Combine all navigation with divider structure
  const navigation = {
    main: [...mainNavigation, ...queueNavigation],
    settings: settingsNavigation
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Navigation Column - Full width on mobile, slide-in when menu open */}
      <div 
        className={`
          bg-gray-900 shadow-lg flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-full lg:w-[230px] lg:min-w-[230px] lg:max-w-[230px]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-white">Dashboard</span>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {/* Main functional pages */}
          {navigation.main.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center pl-6 pr-3 py-3 text-base font-medium rounded-full transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 mr-3 ${
                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                }`} />
                {item.name}
              </Link>
            )
          })}
          
          {/* Divider */}
          <div className="my-4 border-t border-gray-700"></div>
          
          {/* Settings pages */}
          {navigation.settings.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center pl-6 pr-3 py-3 text-base font-medium rounded-full transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 mr-3 ${
                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                }`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center pl-6 pr-3 py-2 text-base font-medium text-gray-300 rounded-full hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ExternalLink className="flex-shrink-0 w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300" />
            Gå til forsiden
          </Link>
        </div>
      </div>

      {/* Right Content Column - Remaining Width */}
      <div className="flex-1 bg-gray-50 flex flex-col lg:ml-0 overflow-hidden">
        {/* LinkedIn Notification Banner */}
        <LinkedInNotificationBanner />
        
        {/* Top Header with Action Icons - Fixed */}
        <div className="bg-white shadow-sm border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Create Dropdown */}
            <div className="relative" ref={createDropdownRef}>
              <button
                onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors focus:outline-none"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>

              {/* Create Dropdown Menu */}
              {createDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/dashboard/new-post"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setCreateDropdownOpen(false)}
                  >
                    <FileText className="w-4 h-4 mr-3 text-gray-400" />
                    Nyt opslag
                  </Link>
                  <Link
                    href="/dashboard/ny-ide"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setCreateDropdownOpen(false)}
                  >
                    <Lightbulb className="w-4 h-4 mr-3 text-gray-400" />
                    Ny idé
                  </Link>
                  <Link
                    href="/dashboard/pdf-generator"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setCreateDropdownOpen(false)}
                  >
                    <FileImage className="w-4 h-4 mr-3 text-gray-400" />
                    PDF Karussel
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors focus:outline-none relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {notificationsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Notifikationer</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Markér alle som læst
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-1">Ingen notifikationer</p>
                      <p className="text-xs text-gray-400">Du har ingen nye notifikationer lige nu</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id)
                            }
                            if (notification.action_url) {
                              router.push(notification.action_url)
                              setNotificationsDropdownOpen(false)
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString('da-DK', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Load More Button */}
                      {hasMoreNotifications && (
                        <div className="px-4 py-3 border-t border-gray-100">
                          <button
                            onClick={loadMoreNotifications}
                            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Vis flere notifikationer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors focus:outline-none"
              >
                <UserIcon className="w-5 h-5 text-gray-600" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userProfile?.name || 'Bruger'}</p>
                    <p className="text-xs text-gray-500">{userProfile?.email || ''}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    Indstillinger
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4 mr-3 text-gray-400" />
                    Gå til forsiden
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                    Log ud
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 p-4 lg:p-8 pb-[100px] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
