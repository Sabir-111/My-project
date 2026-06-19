import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Crown, Eye, Heart, MapPin, MessageCircle, Pencil, Star, Trash2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatPrice } from '../utils/format'

function ListingCard({ item, currentUserId, onDeleted, onFavoriteRemoved }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState(currentUserId || null)
  const [favoriteId, setFavoriteId] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const effectiveUserId = currentUserId !== undefined ? currentUserId : userId
  const isOwner = Boolean(effectiveUserId && effectiveUserId === item.user_id)

  useEffect(() => {
    if (currentUserId !== undefined) {
      setUserId(currentUserId || null)
      return
    }

    loadCurrentUser()
  }, [currentUserId])

  useEffect(() => {
    if (!effectiveUserId || isOwner) {
      setFavoriteId(null)
      onFavoriteRemoved?.(item.id)
      return
    }

    loadFavorite()
  }, [effectiveUserId, isOwner, item.id])

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUserId(user?.id || null)
  }

  const loadFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('listing_id', item.id)
      .maybeSingle()

    setFavoriteId(data?.id || null)
  }

  const sendMessage = async () => {
    const text = message.trim()

    if (!effectiveUserId) {
      alert('Mesaj göndərmək üçün əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    if (isOwner) {
      alert('Öz elanınıza mesaj göndərə bilməzsiniz')
      return
    }

    if (!text) {
      alert('Mesaj mətni yazın')
      return
    }

    setIsBusy(true)

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: effectiveUserId,
        receiver_id: item.user_id,
        text,
      },
    ])

    if (!error) {
      await supabase.from('notifications').insert([
        {
          user_id: item.user_id,
          title: 'Elanınız üçün yeni mesaj var',
        },
      ])
    }

    setIsBusy(false)

    if (error) {
      alert(error.message)
      return
    }

    setMessage('')
    alert('Mesaj göndərildi')
  }

  const toggleFavorite = async () => {
    if (!effectiveUserId) {
      alert('Favori əlavə etmək üçün əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    if (isOwner) {
      alert('Öz elanınızı favorilərə əlavə etməyə ehtiyac yoxdur')
      return
    }

    setIsBusy(true)

    if (favoriteId) {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId)
      setIsBusy(false)

      if (error) {
        alert(error.message)
        return
      }

      setFavoriteId(null)
      return
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          user_id: effectiveUserId,
          listing_id: item.id,
        },
      ])
      .select('id')
      .single()

    setIsBusy(false)

    if (error) {
      alert(error.message)
      return
    }

    setFavoriteId(data?.id || null)
  }

  const deleteListing = async () => {
    if (!isOwner) {
      alert('Bu elanı silmək icazəniz yoxdur')
      return
    }

    const confirmDelete = window.confirm('Elanı silmək istəyirsiniz?')

    if (!confirmDelete) return

    const { error } = await supabase.from('listings').delete().eq('id', item.id)

    if (error) {
      alert(error.message)
      return
    }

    onDeleted?.(item.id)
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {item.premium && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white">
            <Crown size={14} />
            PREMIUM
          </span>
        )}

        {item.is_vip && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-500 px-2.5 py-1 text-xs font-bold text-white">
            <Star size={14} />
            VIP
          </span>
        )}
      </div>

      <Link to={`/listing/${item.id}`} className="block bg-gray-100">
        {item.image ? (
          <img src={item.image} alt={item.title || 'Elan şəkli'} className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 w-full items-center justify-center text-sm font-semibold text-gray-400">
            Şəkil yoxdur
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/listing/${item.id}`} className="block">
          <h2 className="line-clamp-2 min-h-14 text-lg font-bold text-gray-950 hover:text-red-600">
            {item.title}
          </h2>
        </Link>

        <p className="mt-2 text-2xl font-bold text-red-600">{formatPrice(item.price)}</p>

        <div className="mt-3 space-y-1 text-sm text-gray-500">
          <p className="flex items-center gap-2">
            <Eye size={16} />
            {item.views || 0} baxış
          </p>

          {item.city && (
            <p className="flex items-center gap-2">
              <MapPin size={16} />
              {item.city}
            </p>
          )}

          {item.category && <p>{item.category}</p>}
        </div>

        {!isOwner && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Satıcıya mesaj yazın..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  sendMessage()
                }
              }}
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={sendMessage}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
              >
                <MessageCircle size={18} />
                Mesaj
              </button>

              <button
                type="button"
                onClick={toggleFavorite}
                disabled={isBusy}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-semibold ${
                  favoriteId
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} fill={favoriteId ? 'currentColor' : 'none'} />
                {favoriteId ? 'Favoridə' : 'Favori'}
              </button>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to={`/edit/${item.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-3 py-2.5 font-semibold text-white hover:bg-yellow-600"
            >
              <Pencil size={18} />
              Redaktə
            </Link>

            <button
              type="button"
              onClick={deleteListing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-3 py-2.5 font-semibold text-white hover:bg-gray-800"
            >
              <Trash2 size={18} />
              Sil
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default ListingCard
