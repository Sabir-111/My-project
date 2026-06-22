import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://cpkmeqwqftixwzilglgz.supabase.co'

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_O6vWj7-MrjPwHyg4GtepXw_v_rzc3qR'

export const supabase = createClient(supabaseUrl, supabaseKey)
