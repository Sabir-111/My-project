import { supabase } from '../services/supabase'

const sanitizeFileName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const uploadPublicFile = async (bucket, file, folder = 'uploads') => {
  const safeName = sanitizeFileName(file.name) || 'file'
  const path = `${folder}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(bucket).upload(path, file)

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return publicUrl
}
