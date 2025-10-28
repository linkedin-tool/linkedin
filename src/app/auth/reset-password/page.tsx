'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setValidSession(!!session)
    }
    
    checkSession()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch {
      setError('Der skete en fejl ved nulstilling af adgangskode')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (validSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser...</p>
        </div>
      </div>
    )
  }

  // Show error if no valid session
  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Ugyldigt link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Dette link er enten udløbet eller ugyldigt. Prøv at anmode om et nyt link.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <Link href="/auth/forgot-password" className="inline-block">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 h-11 rounded-full transition-all duration-200 shadow-lg">
                Anmod om nyt link
              </Button>
            </Link>
            <Link href="/auth/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Tilbage til login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Adgangskode opdateret!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Din adgangskode er blevet nulstillet. Du bliver omdirigeret til dashboard...
            </p>
          </div>
          
          <Card className="p-8 bg-white shadow-xl border border-blue-100 rounded-3xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Omdirigerer...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <span className="text-2xl text-gray-900">
              <span style={{fontWeight: 800}}>Basic</span>
              <span style={{fontWeight: 300}}>Platform</span>
            </span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Nulstil din adgangskode
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Indtast din nye adgangskode nedenfor.
          </p>
        </div>
        
        <Card className="p-8 bg-white shadow-xl border border-blue-100 rounded-3xl">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-3xl">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-4">
                Ny adgangskode
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-3xl shadow-none"
                placeholder="Mindst 6 tegn"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 ml-4">
                Bekræft ny adgangskode
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-3xl shadow-none"
                placeholder="Gentag adgangskode"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 h-11 rounded-full transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
              disabled={loading}
            >
              {loading ? 'Opdaterer...' : 'Opdater adgangskode'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tilbage til login
          </Link>
        </div>
      </div>
    </div>
  )
}
