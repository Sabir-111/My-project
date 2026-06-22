import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

function NotFound() {
  return (
    <main className="container-page py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">404</p>
      <h1 className="mt-2 text-4xl font-extrabold text-gray-950">Səhifə tapılmadı</h1>
      <p className="mt-3 text-gray-500">
        Axtardığınız səhifə mövcud deyil və ya köçürülüb.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
      >
        <Home size={18} />
        Ana səhifəyə qayıt
      </Link>
    </main>
  )
}

export default NotFound
