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
        setError(error.message)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              opret en ny konto
            </Link>
          </p>
        </div>
        
        <Card className="p-8 bg-white shadow-lg border border-gray-200">
          <form className="space-y-6" onSubmit={handleSignIn}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="din@email.dk"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Glemt adgangskode?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
