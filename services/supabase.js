import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkmeqwqftixwzilglgz.supabase.co'

const supabaseKey = 'sb_publishable_O6vWj7-MrjPwHyg4GtepXw_v_rzc3qR'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)