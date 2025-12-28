
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwfbgcbchhtumvwjrlep.supabase.co';
const supabaseKey = 'sb_publishable_t4atyenI-BZpxcIslvdcAQ_ClldElcK';

export const supabase = createClient(supabaseUrl, supabaseKey);
