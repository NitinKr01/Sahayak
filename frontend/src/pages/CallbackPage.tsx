import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function CallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const exchanged = useRef(false)

  useEffect(() => {
    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) {
      setError('Missing authorization code. Please try logging in again.')
      return
    }
    // Authorization codes are single-use; guard against StrictMode double-run.
    if (exchanged.current) return
    exchanged.current = true

    api
      .postCallback(code, state)
      .then((res) => {
        setUser(res.user)
        navigate('/', { replace: true })
      })
      .catch((e) => setError(e.message || 'Login failed'))
  }, [params, navigate, setUser])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      {error ? (
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
          <p className="font-medium text-red-600">⚠️ {error}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-blue-600 underline">
            Back to login
          </Link>
        </div>
      ) : (
        <p className="text-slate-600">Signing you in…</p>
      )}
    </div>
  )
}
