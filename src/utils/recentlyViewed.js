const STORAGE_KEY = 'recently_viewed_listings'
const MAX_ITEMS = 8

const readRaw = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const getRecentlyViewed = () => readRaw()

export const getRecentlyViewedIds = () => readRaw().map((item) => item.id)

export const addRecentlyViewed = (listing) => {
  if (!listing?.id) return

  const compact = {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    image: listing.image,
    city: listing.city,
    category: listing.category,
  }

  const next = [compact, ...readRaw().filter((item) => item.id !== listing.id)].slice(0, MAX_ITEMS)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota errors */
  }
}
