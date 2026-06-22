import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus } from 'lucide-react'
import { supabase } from '../services/supabase'

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const register = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Email və şifrə daxil edin')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Şifrə ən azı 6 simvol olmalıdır')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Şifrələr uyğun gəlmir')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    alert('Qeydiyyat uğurlu oldu')
    navigate('/login')
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <form onSubmit={register} className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Yeni hesab</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">Qeydiyyat</h1>
        <p className="mt-2 text-gray-500">Favorilər, mesajlar və elanlarınızı idarə etmək üçün hesab yaradın.</p>

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
            autoComplete="new-password"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">Şifrə təkrar</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
          {isLoading ? 'Yaradılır...' : 'Qeydiyyatdan keç'}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Artıq hesabınız var?{' '}
          <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
            Daxil olun
          </Link>
        </p>
      </form>
    </main>
  )
}

export default Register
