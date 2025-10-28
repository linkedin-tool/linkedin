'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])


  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
        <div className="flex justify-between items-center h-20 pl-4 sm:pl-6 lg:pl-8 pr-0" style={{maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto'}}>
            <div className="flex items-center">
              <Link href="/" onClick={closeMobileMenu}>
                <span className="text-xl lg:text-2xl text-gray-900">
                  <span style={{fontWeight: 800}}>Basic</span>
                  <span style={{fontWeight: 300}}>Platform</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/om-os"
                className="text-lg font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Om os
              </Link>
              <Link 
                href="/kontakt"
                className="text-lg font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Kontakt
              </Link>
              <button 
                onClick={() => {
                  const section = document.getElementById('pricing');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-lg font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Priser
              </button>
            </div>
            
            <div className="flex items-center pr-4 sm:pr-6 lg:pr-8">
              {/* Desktop Auth */}
              <div className="hidden md:flex items-center">
                {loading ? (
                  <div className="w-8 h-8 animate-pulse bg-gray-200 rounded"></div>
                ) : user ? (
                  <div className="flex items-center">
                    <Link href="/dashboard">
                      <Button size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link href="/auth/login">
                      <Button variant="outline" size="sm">
                        Log ind
                      </Button>
                    </Link>
                    <Link href="/auth/signup?plan=free_trial">
                      <Button size="sm">
                        Opret gratis
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 relative z-[70] focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-full bg-white transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Navigation Links */}
          <div className="flex-1 px-12 pt-28 space-y-4">
            <Link 
              href="/om-os"
              onClick={closeMobileMenu}
              className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              Om os
            </Link>

            <Link 
              href="/kontakt"
              onClick={closeMobileMenu}
              className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              Kontakt
            </Link>

            <button 
              onClick={() => {
                const section = document.getElementById('pricing');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth' });
                }
                closeMobileMenu()
              }}
              className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 text-left w-full"
            >
              Priser
            </button>


            {/* Mobile Auth */}
            <div className="pt-4 space-y-4">
              {loading ? (
                <div className="w-full h-10 animate-pulse bg-gray-200 rounded"></div>
              ) : user ? (
                <div className="space-y-4">
                  <Link href="/dashboard" onClick={closeMobileMenu}>
                    <Button className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link href="/auth/login" onClick={closeMobileMenu}>
                    <Button variant="outline" className="w-full">
                      Log ind
                    </Button>
                  </Link>
                  <Link href="/auth/signup?plan=free_trial" onClick={closeMobileMenu}>
                    <Button className="w-full">
                      Opret gratis
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
