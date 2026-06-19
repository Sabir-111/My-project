import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, MapPin, MessageCircle, Phone, Send, User } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatDateTime, formatPrice } from '../utils/format'

function ListingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [images, setImages] = useState([])
  const [currentImage, setCurrentImage] = useState(0)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadPage()
  }, [id])

  const galleryImages = useMemo(() => {
    if (images.length > 0) return images
    if (listing?.image) return [{ id: 'main-image', image_url: listing.image }]

    return []
  }, [images, listing?.image])

  const loadPage = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setCurrentUserId(user?.id || null)

    await Promise.all([loadListing(), loadComments()])
    setIsLoading(false)
  }

  const loadListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    const nextViews = (data.views || 0) + 1

    await supabase
      .from('listings')
      .update({
        views: nextViews,
      })
      .eq('id', id)

    setListing({
      ...data,
      views: nextViews,
    })

    const { data: imageData } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', Number(id))
      .order('id', { ascending: true })

    setImages(imageData || [])
    setCurrentImage(0)
  }

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('listing_id', Number(id))
      .order('id', {
        ascending: false,
      })

    if (!error) {
      setComments(data || [])
    }
  }

  const addComment = async () => {
    const text = commentText.trim()

    if (!text) {
      alert('Şərh mətni yazın')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Şərh yazmaq üçün əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    const { error } = await supabase.from('comments').insert([
      {
        listing_id: Number(id),
        user_id: user.id,
        text,
      },
    ])

    if (error) {
      alert(error.message)
      return
    }

    if (listing?.user_id && listing.user_id !== user.id) {
      await supabase.from('notifications').insert([
        {
          user_id: listing.user_id,
          title: 'Elanınıza yeni şərh yazıldı',
        },
      ])
    }

    setCommentText('')
    loadComments()
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Elan yüklənir...</div>
  }

  if (errorMessage || !listing) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-red-700">
          {errorMessage || 'Elan tapılmadı'}
        </div>
      </main>
    )
  }

  const activeImage = galleryImages[currentImage]?.image_url
  const isOwner = currentUserId === listing.user_id

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {activeImage ? (
            <img src={activeImage} alt={listing.title} className="h-[360px] w-full object-cover md:h-[520px]" />
          ) : (
            <div className="flex h-[360px] items-center justify-center bg-gray-100 text-gray-400 md:h-[520px]">
              Şəkil yoxdur
            </div>
          )}

          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-gray-200 p-4">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => setCurrentImage(index)}
                  className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border ${
                    currentImage === index ? 'border-red-600' : 'border-gray-200'
                  }`}
                  aria-label={`Şəkil ${index + 1}`}
                >
                  <img src={image.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">{listing.category}</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-950">{listing.title}</h1>
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-red-600">{formatPrice(listing.price)}</p>

          <div className="mt-5 space-y-3 text-gray-600">
            <p className="flex items-center gap-2">
              <Eye size={18} />
              Baxış sayı: {listing.views || 0}
            </p>

            {listing.phone && (
              <p className="flex items-center gap-2">
                <Phone size={18} />
                {listing.phone}
              </p>
            )}

            {listing.city && (
              <p className="flex items-center gap-2">
                <MapPin size={18} />
                {listing.city}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-2">
            <Link
              to={`/user/${listing.user_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <User size={18} />
              Satıcıya bax
            </Link>

            {!isOwner && (
              <Link
                to={`/chat/${listing.user_id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                <MessageCircle size={18} />
                Satıcıya yaz
              </Link>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-950">Elan haqqında</h2>
        <p className="mt-4 whitespace-pre-line text-gray-700">{listing.description || 'Təsvir qeyd olunmayıb.'}</p>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-950">Şərhlər</h2>
          <span className="text-sm text-gray-500">{comments.length} şərh</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Şərh yazın..."
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                addComment()
              }
            }}
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            type="button"
            onClick={addComment}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            <Send size={18} />
            Göndər
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {comments.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-gray-500">Hələ şərh yoxdur.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
                <p className="text-gray-800">{comment.text}</p>
                <small className="mt-2 block text-gray-500">{formatDateTime(comment.created_at)}</small>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default ListingDetails
