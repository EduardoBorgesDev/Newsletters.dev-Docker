import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Usa auth-helpers para gerenciar sessão via cookies HttpOnly, sem localStorage
export const supabase = createClientComponentClient()
//att
