import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { categories } from '../constants/categories'
import { supabase } from '../services/supabase'

const initialForm = {
  title: '',
  price: '',
  category: '',
  description: '',
  phone: '',
  city: '',
}

function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadListing()
  }, [id])

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const loadListing = async () => {
    setIsLoading(true)

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
      .eq('id', id)
      .single()

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    if (data.user_id !== user.id) {
      alert('Bu elanı redaktə etmək icazəniz yoxdur')
      navigate('/my-listings')
      return
    }

    setForm({
      title: data.title || '',
      price: data.price || '',
      category: data.category || '',
      description: data.description || '',
      phone: data.phone || '',
      city: data.city || '',
    })
    setIsLoading(false)
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

  const updateListing = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('listings')
      .update(form)
      .eq('id', id)

    setIsSaving(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    navigate('/my-listings')
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Elan yüklənir...</div>
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <form onSubmit={updateListing} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Redaktə</p>
          <h1 className="text-3xl font-bold text-gray-950 mt-1">Elanı redaktə et</h1>
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
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Şəhər</span>
            <input
              type="text"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Təsvir</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows="5"
            className="mt-1 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Yadda saxlanır...' : 'Yadda saxla'}
        </button>
      </form>
    </main>
  )
}

export default EditListing
