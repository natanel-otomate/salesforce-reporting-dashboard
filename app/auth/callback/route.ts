import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const state = requestUrl.searchParams.get('state')
  const mondayCode = requestUrl.searchParams.get('monday_code')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return NextResponse.redirect(
      new URL('/auth/error?message=server_configuration_error', requestUrl.origin)
    )
  }

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(errorDescription ?? error)}`,
        requestUrl.origin
      )
    )
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  if (code) {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(
          new URL(
            `/auth/error?message=${encodeURIComponent(sessionError.message)}`,
            requestUrl.origin
          )
        )
      }

      if (!sessionData.session) {
        return NextResponse.redirect(
          new URL('/auth/error?message=no_session_returned', requestUrl.origin)
        )
      }

      const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))

      response.cookies.set('sb-access-token', sessionData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: sessionData.session.expires_in ?? 3600,
        path: '/',
      })

      response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return response
    } catch (err) {
      console.error('Unexpected error during code exchange:', err)
      return NextResponse.redirect(
        new URL('/auth/error?message=unexpected_error', requestUrl.origin)
      )
    }
  }

  if (mondayCode && state) {
    try {
      const accessTokenCookie = request.cookies.get('sb-access-token')

      if (!accessTokenCookie?.value) {
        return NextResponse.redirect(
          new URL('/auth/error?message=not_authenticated', requestUrl.origin)
        )
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(
        accessTokenCookie.value
      )

      if (userError || !userData.user) {
        return NextResponse.redirect(
          new URL('/auth/error?message=invalid_session', requestUrl.origin)
        )
      }

      const mondayClientId = process.env.MONDAY_CLIENT_ID
      const mondayClientSecret = process.env.MONDAY_CLIENT_SECRET
      const mondayRedirectUri = process.env.MONDAY_REDIRECT_URI

      if (!mondayClientId || !mondayClientSecret) {
        console.error('Missing Monday.com OAuth environment variables')
        return NextResponse.redirect(
          new URL('/auth/error?message=monday_not_configured', requestUrl.origin)
        )
      }

      const tokenRequestBody = new URLSearchParams({
        code: mondayCode,
        client_id: mondayClientId,
        client_secret: mondayClientSecret,
        redirect_uri: mondayRedirectUri ?? `${requestUrl.origin}/auth/callback`,
      })

      const tokenResponse = await fetch('https://auth.monday.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody.toString(),
      })

      if (!tokenResponse.ok) {
        const tokenErrorText = await tokenResponse.text()
        console.error('Monday.com token exchange failed:', tokenErrorText)
        return NextResponse.redirect(
          new URL('/auth/error?message=monday_token_exchange_failed', requestUrl.origin)
        )
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string
        token_type: string
        scope: string
      }

      if (!tokenData.access_token) {
        return NextResponse.redirect(
          new URL('/auth/error?message=monday_no_access_token', requestUrl.origin)
        )
      }

      const meQuery = `
        query {
          me {
            id
            name
            email
            account {
              id
              name
            }
          }
        }
      `

      const meResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: tokenData.access_token,
        },
        body: JSON.stringify({ query: meQuery }),
      })

      let mondayAccountId: string | null = null
      let mondayAccountName: string | null = null

      if (meResponse.ok) {
        const meData = (await meResponse.json()) as {
          data?: {
            me?: {
              id: string
              name: string
              email: string
              account?: {
                id: string
                name: string
              }
            }
          }
        }
        mondayAccountId = meData.data?.me?.account?.id ?? null
        mondayAccountName = meData.data?.me?.account?.name ?? null
      }

      const adminSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      const writeClient = serviceRoleKey
        ? createClient<Database>(adminSupabaseUrl, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          })
        : supabase

      const { error: upsertError } = await writeClient
        .from('monday_connections')
        .upsert(
          {
            user_id: userData.user.id,
            access_token: tokenData.access_token,
            monday_account_id: mondayAccountId,
            monday_account_name: mondayAccountName,
            token_type: tokenData.token_type ?? 'Bearer',
            scope: tokenData.scope ?? '',
            connected_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )

      if (upsertError) {
        console.error('Failed to store Monday.com token:', upsertError)
        return NextResponse.redirect(
          new URL('/auth/error?message=failed_to_store_token', requestUrl.origin)
        )
      }

      return NextResponse.redirect(
        new URL('/dashboard?monday_connected=true', requestUrl.origin)
      )
    } catch (err) {
      console.error('Unexpected error during Monday.com OAuth:', err)
      return NextResponse.redirect(
        new URL('/auth/error?message=monday_unexpected_error', requestUrl.origin)
      )
    }
  }

  return NextResponse.redirect(new URL('/auth/error?message=invalid_callback', requestUrl.origin))
}