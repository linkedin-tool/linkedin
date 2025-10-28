'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()
  const supabase = createClient()
  
  useEffect(() => {
    // Check if we were redirected here due to expired token
    const urlError = searchParams.get('error')
    if (urlError === 'expired') {
      setError('Dit reset link er udløbet. Anmod venligst om et nyt link nedenfor.')
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('🔄 Sending password reset email with redirectTo:', redirectUrl)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      console.log('📧 Password reset email result:', { 
        success: !error, 
        error: error?.message || null,
        email,
        redirectUrl 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.log('💥 Exception during password reset:', err)
      setError('Der skete en fejl ved afsendelse af nulstillingslink')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email sendt!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Vi har sendt et link til nulstilling af adgangskode til din email.
            </p>
          </div>
          
          <Card className="p-8 bg-white shadow-xl border border-blue-100 rounded-3xl">
            <div className="text-center space-y-4">
              <Mail className="mx-auto h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">
                  Tjek din indbakke på:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
              <p className="text-xs text-gray-500">
                Hvis du ikke kan finde emailen, tjek din spam-mappe.
              </p>
            </div>
          </Card>

          <div className="text-center space-y-2">
            <Link href="/auth/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Tilbage til login
            </Link>
            <div>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Send til en anden email
              </button>
            </div>
          </div>
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
            Glemt din adgangskode?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Indtast din email adresse, så sender vi dig et link til at nulstille din adgangskode.
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 ml-4">
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
                className="mt-1 border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-3xl shadow-none"
                placeholder="din@email.dk"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white font-semibold py-6 px-6 rounded-full transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
              disabled={loading}
            >
              {loading ? 'Sender...' : 'Send nulstillingslink'}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Indlæser...</p>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
