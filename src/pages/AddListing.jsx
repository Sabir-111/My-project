import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Loader2, PlusCircle, X } from 'lucide-react'
import { categories } from '../constants/categories'
import { supabase } from '../services/supabase'
import { uploadPublicFile } from '../utils/storage'

const initialForm = {
  title: '',
  price: '',
  category: '',
  description: '',
  phone: '',
  city: '',
}

const maxImages = 8

function AddListing() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const previews = images.map((image) => URL.createObjectURL(image))
    setImagePreviews(previews)

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview))
    }
  }, [images])

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleImageChange = (event) => {
    const selectedImages = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, maxImages)

    setImages(selectedImages)
  }

  const removeImage = (index) => {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))
  }

  const validateForm = () => {
    if (!form.title.trim()) return 'Başlıq daxil edin'
    if (!form.category) return 'Kateqoriya seçin'
    if (!form.price || Number(form.price) <= 0) return 'Qiyməti düzgün daxil edin'
    if (!form.phone.trim()) return 'Telefon nömrəsi daxil edin'
    if (!form.city.trim()) return 'Şəhər daxil edin'
    if (!form.description.trim()) return 'Təsvir daxil edin'

    return ''
  }

  const addListing = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsSubmitting(false)
      alert('Əvvəlcə daxil olun')
      navigate('/login')
      return
    }

    const { data: listingData, error } = await supabase
      .from('listings')
      .insert([
        {
          ...form,
          user_id: user.id,
          image: '',
          views: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message)
      return
    }

    const uploadedImageUrls = []
    let uploadFailed = false

    for (const image of images) {
      try {
        const imageUrl = await uploadPublicFile('images', image, `listings/${listingData.id}`)
        uploadedImageUrls.push(imageUrl)

        await supabase.from('listing_images').insert([
          {
            listing_id: listingData.id,
            image_url: imageUrl,
          },
        ])
      } catch {
        uploadFailed = true
      }
    }

    if (uploadedImageUrls.length > 0) {
      await supabase
        .from('listings')
        .update({
          image: uploadedImageUrls[0],
        })
        .eq('id', listingData.id)
    }

    setForm(initialForm)
    setImages([])
    setIsSubmitting(false)

    if (uploadFailed) {
      alert('Elan yaradıldı, lakin bəzi şəkillər yüklənmədi. Şəkilləri redaktədən yenidən əlavə edə bilərsiniz.')
    }

    navigate(`/listing/${listingData.id}`)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <form onSubmit={addListing} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Yeni elan</p>
          <h1 className="text-3xl font-bold text-gray-950 mt-1">Elan yerləşdir</h1>
          <p className="text-gray-500 mt-2">Məlumatları dəqiq yazın ki, alıcılar sizinlə rahat əlaqə saxlasın.</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Kateqoriya</span>
            <select
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Kateqoriya seçin</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Qiymət</span>
            <input
              type="number"
              min="0"
              placeholder="Məsələn: 120"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Başlıq</span>
          <input
            type="text"
            placeholder="Elanın qısa başlığı"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Telefon</span>
            <input
              type="tel"
              placeholder="+994..."
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Şəhər</span>
            <input
              type="text"
              placeholder="Bakı"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Təsvir</span>
          <textarea
            placeholder="Elan haqqında ətraflı məlumat"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows="5"
            className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>

        <div>
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-red-300 hover:bg-red-50">
            <ImagePlus className="mb-2 text-red-600" size={28} />
            <span className="font-semibold text-gray-800">Şəkilləri seç</span>
            <span className="text-sm text-gray-500">Maksimum {maxImages} şəkil</span>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </label>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={preview} className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img src={preview} alt={`Seçilmiş şəkil ${index + 1}`} className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-white p-1 text-gray-700 shadow"
                    aria-label="Şəkli sil"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
          {isSubmitting ? 'Yüklənir...' : 'Elan əlavə et'}
        </button>
      </form>
    </main>
  )
}

export default AddListing
