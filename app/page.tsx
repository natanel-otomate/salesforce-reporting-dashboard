'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

interface AuthFormState {
  email: string
  password: string
  isLoading: boolean
  error: string | null
  mode: 'login' | 'signup'
}

export default function LandingPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [formState, setFormState] = useState<AuthFormState>({
    email: '',
    password: '',
    isLoading: false,
    error: null,
    mode: 'login',
  })

  const handleChange = (field: keyof Pick<AuthFormState, 'email' | 'password'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value, error: null }))
    }

  const toggleMode = () => {
    setFormState((prev) => ({
      ...prev,
      mode: prev.mode === 'login' ? 'signup' : 'login',
      error: null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }))

    const { email, password, mode } = formState

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setFormState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Account created! Check your email to confirm, then log in.',
        }))
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setFormState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }

  const { email, password, isLoading, error, mode } = formState

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500 shadow-lg mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">BoardPulse</h1>
        <p className="mt-2 text-lg text-slate-300 max-w-sm mx-auto">
          Every project. One view. Automatically.
        </p>
        <p className="mt-1 text-sm text-slate-400 max-w-xs mx-auto">
          Unified executive reporting for all your Monday.com workspaces — no CSV exports, no spreadsheets.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-1">
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {mode === 'login'
            ? 'Welcome back — enter your credentials to continue.'
            : 'Get started free — no credit card required.'}
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleChange('email')}
              disabled={isLoading}
              placeholder="you@company.com"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={handleChange('password')}
              disabled={isLoading}
              placeholder={mode === 'login' ? '••••••••' : 'Minimum 6 characters'}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Error / Info Message */}
          {error && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                error.toLowerCase().includes('created') || error.toLowerCase().includes('confirm')
                  ? 'bg-emerald-900/50 border border-emerald-700 text-emerald-300'
                  : 'bg-red-900/50 border border-red-700 text-red-300'
              }`}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isLoading
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        {/* Mode Toggle */}
        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            disabled={isLoading}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-500 text-center">
        &copy; {new Date().getFullYear()} BoardPulse. Built for operations teams who move fast.
      </p>
    </main>
  )
}