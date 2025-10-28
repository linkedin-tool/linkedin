'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Oversæt almindelige fejlbeskeder til dansk
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Ugyldig email eller adgangskode'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email ikke bekræftet. Tjek din indbakke.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'For mange forsøg. Prøv igen senere.'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Bruger ikke fundet'
        }
        setError(errorMessage)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Der skete en fejl ved login')
    } finally {
      setLoading(false)
    }
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
            Log ind på din konto
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Eller{' '}
            <Link href="/auth/signup?plan=free_trial" className="font-medium text-blue-600 hover:text-blue-500">
              opret en ny konto
            </Link>
          </p>
        </div>
        
        <Card className="p-8 bg-white shadow-xl border border-blue-100 rounded-3xl">
          <form className="space-y-6" onSubmit={handleSignIn}>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-4">
                Adgangskode
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-3xl shadow-none"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Glemt adgangskode?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-500">
            ← Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  )
}
