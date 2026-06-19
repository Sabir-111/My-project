import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { supabase } from '../services/supabase'

function Favorites() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    setCurrentUserId(user.id)

    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)

    if (favoritesError) {
      setErrorMessage(favoritesError.message)
      setIsLoading(false)
      return
    }

    const listingIds = (favorites || []).map((fav) => fav.listing_id)

    if (listingIds.length === 0) {
      setListings([])
      setIsLoading(false)
      return
    }

    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)

    if (listingsError) {
      setErrorMessage(listingsError.message)
    } else {
      setListings(listingsData || [])
    }

    setIsLoading(false)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Saxlanılanlar</p>
        <h1 className="text-3xl font-bold text-gray-950">Favorilər</h1>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Favorilər yüklənir...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="font-semibold text-gray-700">Favori elan yoxdur</p>
          <Link to="/" className="mt-3 inline-flex font-semibold text-red-600 hover:text-red-700">
            Elanlara bax
          </Link>
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
              onFavoriteRemoved={(listingId) =>
                setListings((current) => current.filter((listing) => listing.id !== listingId))
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}

export default Favorites
