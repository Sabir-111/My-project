import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, Upload } from 'lucide-react'
import { supabase } from '../services/supabase'
import { uploadPublicFile } from '../utils/storage'

function Profile() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(avatar)
      return
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [avatar, avatarFile])

  const loadProfile = async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
    }

    if (data) {
      setUsername(data.username || '')
      setBio(data.bio || '')
      setAvatar(data.avatar || '')
    }

    setIsLoading(false)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!username.trim()) {
      setErrorMessage('İstifadəçi adı daxil edin')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    setIsSaving(true)

    try {
      let avatarUrl = avatar

      if (avatarFile) {
        avatarUrl = await uploadPublicFile('avatars', avatarFile, `profiles/${user.id}`)
      }

      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: username.trim(),
          bio: bio.trim(),
          avatar: avatarUrl,
        },
        {
          onConflict: 'id',
        }
      )

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setAvatar(avatarUrl)
      setAvatarFile(null)
      alert('Profil yadda saxlandı')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-600">Profil yüklənir...</div>
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <form onSubmit={saveProfile} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Hesab</p>
          <h1 className="text-3xl font-bold text-gray-950">Profil</h1>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Profil şəkli" className="h-32 w-32 rounded-full object-cover ring-4 ring-red-50" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-400">
              Şəkil yoxdur
            </div>
          )}

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
            <Upload size={18} />
            Avatar seç
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-gray-700">İstifadəçi adı</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows="4"
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Saxlanılır...' : 'Yadda saxla'}
        </button>
      </form>
    </main>
  )
}

export default Profile
