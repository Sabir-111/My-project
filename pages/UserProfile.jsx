import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { supabase } from '../services/supabase'

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [message, setMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadPage()
  }, [id])

  const loadPage = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setCurrentUserId(user?.id || null)

    const [{ data: profileData, error: profileError }, { data: listingsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('listings').select('*').eq('user_id', id).order('id', { ascending: false }),
    ])

    if (profileError) {
      setErrorMessage(profileError.message)
    }

    setProfile(profileData)
    setListings(listingsData || [])
    setIsLoading(false)
  }

  const sendMessage = async () => {
    const text = message.trim()

    if (!text) {
      alert('Mesaj mətni yazın')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Mesaj göndərmək üçün əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    if (user.id === id) {
      alert('Öz profilinizə mesaj göndərə bilməzsiniz')
      return
    }

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: id,
        text,
      },
    ])

    if (error) {
      alert(error.message)
      return
    }

    await supabase.from('notifications').insert([
      {
        user_id: id,
        title: 'Sizə yeni mesaj gəldi',
      },
    ])

    setMessage('')
    alert('Mesaj göndərildi')
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Profil yüklənir...</div>
  }

  if (errorMessage || !profile) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-red-700">
          {errorMessage || 'Profil tapılmadı'}
        </div>
      </main>
    )
  }

  const isOwnProfile = currentUserId === id

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-600">
                {(profile.username || 'İ').slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-950">{profile.username || 'İstifadəçi'}</h1>
              <p className="mt-2 text-gray-600">{profile.bio || 'Bio qeyd olunmayıb.'}</p>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/profile" className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">
              Profili redaktə et
            </Link>
          )}
        </div>
      </section>

      {!isOwnProfile && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-950">
            <MessageCircle size={20} />
            Satıcıya mesaj
          </h2>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Mesaj yazın..."
            rows="4"
            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            type="button"
            onClick={sendMessage}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            <Send size={18} />
            Mesaj göndər
          </button>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950">Satıcının elanları</h2>
          <span className="text-sm text-gray-500">{listings.length} elan</span>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            Bu istifadəçinin aktiv elanı yoxdur.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                onDeleted={(listingId) =>
                  setListings((current) => current.filter((listing) => listing.id !== listingId))
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default UserProfile
