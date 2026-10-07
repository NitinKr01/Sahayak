import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setBusy(true)
    setError(null)
    try {
      await login()
    } catch {
      setError('Could not reach the login service. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-offwhite px-5 py-10">
      <img src="/header.png" alt="Bandhan Life" className="mb-8 h-9 w-auto" />

      <div className="w-full max-w-[380px] rounded-[16px] border border-[rgba(21,48,80,0.1)] bg-white px-6 py-9 text-center shadow-lg">
        <div className="mx-auto mb-5 h-[70px] w-[70px] overflow-hidden rounded-[20px] bg-white shadow-lg">
          <img src="/logo.png" alt="" className="h-full w-full object-contain p-2" />
        </div>

        <h1 className="text-[20px] font-bold text-prussian">
          Sahayak <span className="text-chilli">AI</span>
        </h1>
        <p className="mx-auto mt-2 max-w-[260px] text-[12.5px] leading-[1.55] text-subtext">
          Your intelligent sales partner for Bandhan Life products, policies &amp; processes.
        </p>

        <button
          onClick={handleLogin}
          disabled={busy}
          className="mt-7 w-full rounded-[10px] bg-prussian px-7 py-3 text-[13px] font-bold text-white shadow-[0_3px_10px_rgba(21,48,80,0.24)] transition-all hover:-translate-y-px hover:opacity-95 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? 'Redirecting…' : 'Login with SSO'}
        </button>

        <p className="mt-3.5 text-[11px] text-mutedtext">
          Secure login with your organization credentials
        </p>

        {error && (
          <p className="mt-3 rounded-md border border-[rgba(229,45,18,0.2)] bg-[rgba(229,45,18,0.08)] px-3 py-2 text-[11.5px] text-chilli">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-[10px] text-mutedtext">
        Sahayak AI · Always verify before sharing with customers
      </p>
    </div>
  )
}
