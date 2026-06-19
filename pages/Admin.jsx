import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Heart, MessageSquare, Shield, Star, Trash2, Users } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatPrice } from '../utils/format'

function Admin() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [stats, setStats] = useState({
    listings: 0,
    messages: 0,
    favorites: 0,
  })

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminData) {
      alert('Admin icazəniz yoxdur')
      navigate('/')
      return
    }

    await Promise.all([fetchListings(), fetchProfiles(), fetchStats()])
    setIsLoading(false)
  }

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*')
    setProfiles(data || [])
  }

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setListings(data || [])
  }

  const fetchStats = async () => {
    const [{ count: listingCount }, { count: messageCount }, { count: favoriteCount }] = await Promise.all([
      supabase.from('listings').select('*', {
        count: 'exact',
        head: true,
      }),
      supabase.from('messages').select('*', {
        count: 'exact',
        head: true,
      }),
      supabase.from('favorites').select('*', {
        count: 'exact',
        head: true,
      }),
    ])

    setStats({
      listings: listingCount || 0,
      messages: messageCount || 0,
      favorites: favoriteCount || 0,
    })
  }

  const deleteListing = async (item) => {
    const ok = window.confirm('Elanı silmək istəyirsiniz?')
    if (!ok) return

    const { error } = await supabase.from('listings').delete().eq('id', item.id)

    if (error) {
      alert(error.message)
      return
    }

    setListings((current) => current.filter((listing) => listing.id !== item.id))
    fetchStats()
  }

  const promoteListing = async (item, field) => {
    const { error } = await supabase
      .from('listings')
      .update({
        [field]: true,
      })
      .eq('id', item.id)

    if (error) {
      alert(error.message)
      return
    }

    await supabase.from('notifications').insert([
      {
        user_id: item.user_id,
        title: field === 'premium' ? 'Elanınız PREMIUM edildi' : 'Elanınız VIP edildi',
      },
    ])

    fetchListings()
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Admin panel yüklənir...</div>
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-red-50 p-3 text-red-600">
          <Shield size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">İdarəetmə</p>
          <h1 className="text-3xl font-bold text-gray-950">Admin panel</h1>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Users size={18} />
            İstifadəçilər
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-950">{profiles.length}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield size={18} />
            Elanlar
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-950">{stats.listings}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <MessageSquare size={18} />
            Mesajlar
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-950">{stats.messages}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Heart size={18} />
            Favorilər
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-950">{stats.favorites}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-950">Elanlar</h2>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            Elan yoxdur.
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[96px_1fr_auto]"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-24 w-24 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                    Şəkil yoxdur
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-1 font-semibold text-red-600">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {item.premium && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 font-semibold text-purple-700">
                        <Crown size={14} />
                        Premium
                      </span>
                    )}
                    {item.is_vip && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 font-semibold text-yellow-700">
                        <Star size={14} />
                        VIP
                      </span>
                    )}
                    {item.category && <span className="rounded-lg bg-gray-100 px-2 py-1 text-gray-600">{item.category}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => promoteListing(item, 'premium')}
                    disabled={item.premium}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 font-semibold text-white hover:bg-purple-700 disabled:bg-purple-300"
                  >
                    <Crown size={18} />
                    Premium et
                  </button>

                  <button
                    type="button"
                    onClick={() => promoteListing(item, 'is_vip')}
                    disabled={item.is_vip}
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 font-semibold text-white hover:bg-yellow-600 disabled:bg-yellow-300"
                  >
                    <Star size={18} />
                    VIP et
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteListing(item)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Admin
