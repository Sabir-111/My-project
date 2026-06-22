import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatPrice } from '../utils/format'

function MyListings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setListings(data || [])
    }

    setIsLoading(false)
  }

  const deleteListing = async (id) => {
    const ok = window.confirm('Elanı silmək istəyirsiniz?')

    if (!ok) return

    const { error } = await supabase.from('listings').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setListings((current) => current.filter((item) => item.id !== id))
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Şəxsi kabinet</p>
          <h1 className="text-3xl font-bold text-gray-950">Mənim elanlarım</h1>
        </div>

        <Link
          to="/add-listing"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
        >
          <PlusCircle size={20} />
          Yeni elan
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Elanlar yüklənir...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="font-semibold text-gray-700">Hələ elanınız yoxdur</p>
          <Link to="/add-listing" className="mt-3 inline-flex text-red-600 font-semibold hover:text-red-700">
            İlk elanı yerləşdirin
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[96px_1fr_auto]"
            >
              {item.image ? (
                <img src={item.image} alt={item.title} className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                  Şəkil yoxdur
                </div>
              )}

              <div>
                <Link to={`/listing/${item.id}`} className="text-lg font-bold text-gray-950 hover:text-red-600">
                  {item.title}
                </Link>
                <p className="mt-1 font-semibold text-red-600">{formatPrice(item.price)}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {item.category} {item.city ? `• ${item.city}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                <Link
                  to={`/edit/${item.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600"
                >
                  <Pencil size={18} />
                  Redaktə
                </Link>

                <button
                  type="button"
                  onClick={() => deleteListing(item.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default MyListings
