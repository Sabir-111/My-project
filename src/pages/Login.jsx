import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { supabase } from '../services/supabase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const login = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Email və şifrə daxil edin')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    navigate('/')
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <form onSubmit={login} className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Hesab</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">Daxil ol</h1>
        <p className="mt-2 text-gray-500">Elan yerləşdirmək və mesajlara baxmaq üçün hesabınıza daxil olun.</p>

        {errorMessage && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <label className="mt-5 block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            autoComplete="email"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">Şifrə</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {isLoading ? 'Yoxlanılır...' : 'Daxil ol'}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Hesabınız yoxdur?{' '}
          <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
            Qeydiyyatdan keçin
          </Link>
        </p>
      </form>
    </main>
  )
}

export default Login
