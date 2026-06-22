import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Crown,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatPrice } from '../utils/format'

function ListingCard({
  item,
  currentUserId = null,
  onDeleted,
  onFavoriteRemoved,
}) {
  const navigate = useNavigate()

  const [message, setMessage] = useState('')
  const [localUserId, setLocalUserId] = useState(currentUserId || null)
  const [favoriteId, setFavoriteId] = useState(null)

  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isMessageSending, setIsMessageSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const effectiveUserId = currentUserId ?? localUserId
  const isOwner = !!effectiveUserId && effectiveUserId === item.user_id

  useEffect(() => {
    if (currentUserId) {
      setLocalUserId(currentUserId)
      return
    }

    loadCurrentUser()
  }, [currentUserId])

  useEffect(() => {
    if (!effectiveUserId || isOwner) {
      setFavoriteId(null)
      return
    }

    loadFavorite()
  }, [effectiveUserId, isOwner, item.id])

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setLocalUserId(user?.id || null)
  }

  const loadFavorite = async () => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('listing_id', item.id)
      .maybeSingle()

    if (!error) {
      setFavoriteId(data?.id || null)
    }
  }

  const createdAtText = useMemo(() => {
    if (!item?.created_at) return ''
    return new Date(item.created_at).toLocaleDateString('az-AZ')
  }, [item?.created_at])

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
      alert('Mesaj yazın')
      return
    }

    setIsMessageSending(true)

    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: effectiveUserId,
          receiver_id: item.user_id,
          text,
        },
      ])

      if (error) {
        alert(error.message)
        return
      }

      await supabase.from('notifications').insert([
        {
          user_id: item.user_id,
          title: 'Elanınız üçün yeni mesaj var',
        },
      ])

      setMessage('')
      alert('Mesaj göndərildi')
    } catch (error) {
      alert(error.message || 'Mesaj göndərilmədi')
    } finally {
      setIsMessageSending(false)
    }
  }

  const toggleFavorite = async () => {
    if (!effectiveUserId) {
      alert('Favori əlavə etmək üçün əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    if (isOwner) {
      alert('Öz elanınızı favoriyə əlavə etməyə ehtiyac yoxdur')
      return
    }

    setIsFavoriteLoading(true)

    try {
      if (favoriteId) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteId)

        if (error) {
          alert(error.message)
          return
        }

        setFavoriteId(null)
        onFavoriteRemoved?.(item.id)
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

      if (error) {
        alert(error.message)
        return
      }

      setFavoriteId(data?.id || null)
    } catch (error) {
      alert(error.message || 'Favori əməliyyatı alınmadı')
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const deleteListing = async () => {
    if (!isOwner) {
      alert('Bu elanı silmək icazəniz yoxdur')
      return
    }

    const ok = window.confirm('Elanı silmək istəyirsiniz?')
    if (!ok) return

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', item.id)

      if (error) {
        alert(error.message)
        return
      }

      onDeleted?.(item.id)
    } catch (error) {
      alert(error.message || 'Elan silinmədi')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Şəkil hissəsi */}
      <div className="relative">
        <Link to={`/listing/${item.id}`} className="block">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title || 'Elan şəkli'}
              className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-400">
              Şəkil yoxdur
            </div>
          )}
        </Link>

        {/* Premium / VIP badge */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {item.premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow">
              <Crown size={14} />
              PREMIUM
            </span>
          )}

          {item.is_vip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow">
              <Star size={14} />
              VIP
            </span>
          )}
        </div>

        {/* Favori düyməsi */}
        {!isOwner && (
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={isFavoriteLoading}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow transition ${
              favoriteId
                ? 'bg-red-600 text-white'
                : 'bg-white/95 text-gray-700 hover:bg-red-50'
            } ${isFavoriteLoading ? 'opacity-70' : ''}`}
          >
            {isFavoriteLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Heart
                size={18}
                fill={favoriteId ? 'currentColor' : 'none'}
              />
            )}
          </button>
        )}
      </div>

      {/* Məzmun */}
      <div className="p-4">
        {/* Qiymət */}
        <div className="mb-2 text-2xl font-extrabold text-red-600">
          {formatPrice(item.price)}
        </div>

        {/* Başlıq */}
        <Link to={`/listing/${item.id}`} className="block">
          <h2 className="line-clamp-2 min-h-[56px] text-[17px] font-bold leading-6 text-gray-900 transition hover:text-red-600">
            {item.title || 'Başlıqsız elan'}
          </h2>
        </Link>

        {/* Meta */}
        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-500">
          {item.city && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span>{item.city}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-400" />
              <span>{item.views || 0} baxış</span>
            </div>

            {createdAtText && (
              <span className="text-xs text-gray-400">
                {createdAtText}
              </span>
            )}
          </div>

          {item.category && (
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {item.category}
            </div>
          )}
        </div>

        {/* Owner deyilsə mesaj hissəsi */}
        {!isOwner && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <input
              type="text"
              placeholder="Satıcıya mesaj yaz..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isMessageSending) {
                  sendMessage()
                }
              }}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={isMessageSending}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isMessageSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <MessageCircle size={18} />
              )}
              {isMessageSending ? 'Göndərilir...' : 'Mesaj göndər'}
            </button>
          </div>
        )}

        {/* Owner-dirsə idarəetmə */}
        {isOwner && (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
            <Link
              to={`/edit/${item.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-3 font-semibold text-white transition hover:bg-amber-600"
            >
              <Pencil size={18} />
              Redaktə
            </Link>

            <button
              type="button"
              onClick={deleteListing}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              {isDeleting ? 'Silinir...' : 'Sil'}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default ListingCard