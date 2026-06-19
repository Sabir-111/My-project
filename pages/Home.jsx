import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { categories } from '../constants/categories'
import { supabase } from '../services/supabase'
import { parsePrice } from '../utils/format'

function Home() {
  const [listings, setListings] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchListings()
    loadUser()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setCurrentUserId(user?.id || null)
  }

  const fetchListings = async () => {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('premium', { ascending: false })
      .order('is_vip', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setListings(data || [])
    }

    setIsLoading(false)
  }

  const filteredListings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const min = minPrice === '' ? null : Number(minPrice)
    const max = maxPrice === '' ? null : Number(maxPrice)

    return listings
      .filter((item) => {
        const searchableText = [
          item.title,
          item.category,
          item.city,
          item.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const itemPrice = parsePrice(item.price)
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)
        const matchesCategory = !selectedCategory || item.category === selectedCategory
        const matchesMinPrice = min === null || (itemPrice !== null && itemPrice >= min)
        const matchesMaxPrice = max === null || (itemPrice !== null && itemPrice <= max)

        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice
      })
      .sort((first, second) => {
        if (sortBy === 'price_asc') {
          return (parsePrice(first.price) || 0) - (parsePrice(second.price) || 0)
        }

        if (sortBy === 'price_desc') {
          return (parsePrice(second.price) || 0) - (parsePrice(first.price) || 0)
        }

        if (sortBy === 'views') {
          return (second.views || 0) - (first.views || 0)
        }

        return (second.id || 0) - (first.id || 0)
      })
  }, [listings, maxPrice, minPrice, search, selectedCategory, sortBy])

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  return (
    <main>
      <section className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-100">Elan.az</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold">Azərbaycanda al, sat və elan ver</h1>
            <p className="mt-3 text-red-50">Axtarış, kateqoriya və qiymət filtrləri ilə lazımi elanı daha tez tapın.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Nə axtarırsınız?"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border-0 py-4 pl-12 pr-4 text-gray-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
              />
            </label>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border-0 px-4 py-4 text-gray-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Sıralama"
            >
              <option value="newest">Ən yeni</option>
              <option value="price_asc">Qiymət artan</option>
              <option value="price_desc">Qiymət azalan</option>
              <option value="views">Ən çox baxılan</option>
            </select>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal size={16} />
                Kateqoriya
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Bütün kateqoriyalar</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="lg:w-44">
              <span className="block text-sm font-semibold text-gray-700 mb-1">Min qiymət</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>

            <label className="lg:w-44">
              <span className="block text-sm font-semibold text-gray-700 mb-1">Max qiymət</span>
              <input
                type="number"
                min="0"
                placeholder="5000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              <X size={18} />
              Təmizlə
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-950">Elanlar</h2>
          <span className="text-sm text-gray-500">{filteredListings.length} nəticə</span>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">Elanlar yüklənir...</div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            Axtarışa uyğun elan tapılmadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredListings.map((item) => (
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

export default Home
