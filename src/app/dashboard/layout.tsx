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
  ChevronDown,
  Menu,
  X,
  Link as LinkIcon,
  PlusCircle,
  FileText,
  Calendar,
  Activity
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

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

      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen])

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
      name: 'Nyt Opslag', 
      href: '/dashboard/new-post', 
      icon: PlusCircle,
      current: pathname === '/dashboard/new-post' 
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
        
        {/* Top Header with User Dropdown - Fixed */}
        <div className="bg-white shadow-sm border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex justify-end flex-1 lg:w-full">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-3 text-sm focus:outline-none"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.name || 'Bruger'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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
