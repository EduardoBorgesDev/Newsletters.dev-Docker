"use client"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
      setLoading(false)
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const refresh = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data?.user || null)
  }

  return { user, loading, refresh }
}
//att
