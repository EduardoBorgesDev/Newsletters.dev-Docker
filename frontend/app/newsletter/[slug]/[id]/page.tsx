"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import { useUser } from "../../../../hooks/useUser"

export default function NewsletterDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const id = params.id as string
  const { user } = useUser()
  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      // Carrega newsletter pelo id
      const { data, error } = await supabase
        .from("newsletters")
        .select("id,title,description,image_url,category,created_at,author_id,author_name_slug")
        .eq("id", id)
        .maybeSingle()
      if (!error && data) {
        // Segurança leve: conferir se o slug da URL bate com o autor
        const isOwn = !!user?.user_metadata?.name && user.user_metadata.name
          .toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-") === slug
        const ok = isOwn || data.author_name_slug === slug
        setItem(ok ? data : null)
      }
      setLoading(false)
    }
    if (id) fetchDetail()
  }, [id, slug, user?.user_metadata?.name])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-12">Carregando...</div>
  }
  if (!item) {
    return <div className="max-w-3xl mx-auto px-6 py-12">Newsletter não encontrada.</div>
  }

  const displayName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || "Perfil"
  })()

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <Link href={`/newsletter/${slug}`}>
          <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide">NEWSLETTERS.dev</h1>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white hidden md:block">{displayName}</span>
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-white"
              style={{ verticalAlign: 'middle' }}
            />
          ) : (
            <span
              className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-sm text-purple-700 border-2 border-white font-bold"
              style={{ verticalAlign: 'middle' }}
            >
              {(displayName || "N").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/newsletter/${slug}`} className="flex items-center gap-2 text-black hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <div className="text-sm text-gray-600">{new Date(item.created_at).toLocaleDateString()}</div>
        </div>

        <div className="mb-8 border-2 border-black">
          <img src={item.image_url || "/placeholder.svg"} alt={item.title} className="w-full h-[380px] object-cover" />
        </div>

        <h2 className="text-3xl font-bold mb-4">{item.title}</h2>
        <p className="text-base text-gray-800 whitespace-pre-line mb-8">{item.description}</p>
        <div className="text-sm text-gray-600">{item.category || "Sem categoria"}</div>
      </main>
    </div>
  )
}
