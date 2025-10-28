import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token') // For legacy/implicit flow
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')

  console.log('🔄 Auth callback received:', {
    token_hash: token_hash ? 'present' : 'missing',
    token: token ? 'present' : 'missing',
    type,
    code: code ? 'present' : 'missing',
    next,
    error_code,
    error_description,
    origin
  })

  // If there's an error from Supabase Auth, redirect to error page with details
  if (error_code) {
    const errorUrl = new URL(`${origin}/auth/login`)
    errorUrl.searchParams.set('error', error_code)
    if (error_description) {
      errorUrl.searchParams.set('error_description', error_description)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  // Create redirect link without the secret token/code
  const redirectTo = new URL(origin)
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Handle OAuth code exchange (for OAuth providers)
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('✅ OAuth code exchange successful')
        redirectTo.searchParams.delete('next')
        return NextResponse.redirect(redirectTo.toString())
      } else {
        console.log('❌ OAuth code exchange failed:', error.message)
      }
    } catch (err) {
      console.log('💥 OAuth code exchange exception:', err)
      // Code exchange failed, continue to error page
    }
  }

  // Handle OTP token verification (for email/SMS OTP)
  if ((token_hash || token) && type) {
    try {
      const tokenToUse = token_hash || token
      console.log('🔐 Attempting to verify OTP:', { 
        type, 
        tokenType: token_hash ? 'token_hash' : 'token',
        token: tokenToUse?.substring(0, 10) + '...' 
      })
      
      let verifyResult
      
      if (token_hash) {
        // PKCE flow - use token_hash
        verifyResult = await supabase.auth.verifyOtp({
          type,
          token_hash,
        })
      } else if (token) {
        // For implicit flow with token, we need to handle it differently
        // The token parameter in the URL is actually the token_hash for PKCE
        // Let's treat it as token_hash since that's what Supabase expects
        verifyResult = await supabase.auth.verifyOtp({
          type,
          token_hash: token,
        })
      }
      
      const { data, error } = verifyResult || {}
      
      if (!error && data?.session) {
        console.log('✅ OTP verification successful for type:', type)
        
        // For password recovery, redirect to reset-password page
        if (type === 'recovery') {
          console.log('🔄 Redirecting to reset-password page')
          return NextResponse.redirect(`${origin}/auth/reset-password`)
        }
        
        // For other types, redirect to the specified next URL or dashboard
        console.log('🔄 Redirecting to:', redirectTo.toString())
        redirectTo.searchParams.delete('next')
        return NextResponse.redirect(redirectTo.toString())
      } else {
        console.log('❌ OTP verification failed:', error?.message || 'No session created')
        
        // For recovery type, redirect to forgot password with error
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/auth/forgot-password?error=expired`)
        }
      }
    } catch (err) {
      console.log('💥 OTP verification exception:', err)
      // Token verification failed, continue to error page
    }
  }

  // If no token_hash, token, or code, this might be a direct access
  if (!token_hash && !token && !code) {
    console.log('⚠️ No token_hash, token, or code provided, redirecting to login')
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Return the user to login page with instructions
  console.log('❌ All verification attempts failed, redirecting to login page')
  return NextResponse.redirect(`${origin}/auth/login`)
}
