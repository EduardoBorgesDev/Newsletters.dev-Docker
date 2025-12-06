"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { useUser } from "../../../hooks/useUser"
import { supabase } from "../../../lib/supabase"

export default function UserNewslettersPage() {
  const params = useParams()
  const slug = params.slug as string
  const [items, setItems] = useState<any[]>([])
  const [pageBg, setPageBg] = useState<{ type: 'color' | 'image', color?: string | null, imageUrl?: string | null }>({ type: 'color', color: '#ffffff' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { user } = useUser()
  const userName = user?.user_metadata?.name as string | undefined
  const userNameSlug = (userName || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")

  const displayName = (() => {
    const isOwn = userNameSlug && userNameSlug === slug
    if (!isOwn) return "Perfil"
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || "Perfil"
  })()

  useEffect(() => {
    async function fetchUserNewsletters() {
      setLoading(true)
      // Primeira tentativa: sempre por slug (independe da sessão já ter carregado)
      const { data: bySlug, error: errSlug } = await supabase
        .from("newsletters")
        .select("id,title,description,image_url,category,created_at,author_id,author_name_slug")
        .eq("author_name_slug", slug)
        .order("created_at", { ascending: false })

      if (errSlug) {
        console.error("Erro ao carregar newsletters (slug):", errSlug.message)
      }

      // Fallback: se for sua página e não houver resultados, tenta por author_id
      if ((!bySlug || bySlug.length === 0) && userNameSlug === slug && user?.id) {
        const { data: byAuthor, error: errAuthor } = await supabase
          .from("newsletters")
          .select("id,title,description,image_url,category,created_at,author_id,author_name_slug")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
        if (errAuthor) {
          console.error("Erro ao carregar newsletters (author_id):", errAuthor.message)
        }
        setItems(byAuthor || [])
        // try load settings for this author
        const authorId = byAuthor?.[0]?.author_id || null
        if (authorId) {
          const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', authorId).single()
          if (settings) {
            setPageBg({ type: settings.bg_type || 'color', color: settings.bg_color || '#ffffff', imageUrl: settings.bg_image_url || null })
          }
        }
      } else {
        setItems(bySlug || [])
        const authorId = bySlug?.[0]?.author_id || null
        if (authorId) {
          const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', authorId).single()
          if (settings) {
            setPageBg({ type: settings.bg_type || 'color', color: settings.bg_color || '#ffffff', imageUrl: settings.bg_image_url || null })
          }
        }
      }
      setLoading(false)
    }
    fetchUserNewsletters()
  }, [slug, userNameSlug, user?.id])

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const pageStyle: any = {}
  if (pageBg.type === 'color' && pageBg.color) pageStyle.backgroundColor = pageBg.color
  if (pageBg.type === 'image' && pageBg.imageUrl) pageStyle.backgroundImage = `url(${pageBg.imageUrl})`
  if (pageBg.type === 'image') {
    pageStyle.backgroundSize = 'cover'
    pageStyle.backgroundPosition = 'center'
  }

  return (
    <div className="min-h-screen" style={pageStyle}>
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link href={`/newsletter/${slug}`}>
            <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide">NEWSLETTERS.dev</h1>
          </Link>
          <div className="flex items-center gap-4" ref={profileRef}>
            {/* Sino para inscrição */}
            <button
              className="text-white hover:text-gray-300 flex items-center"
              title="Inscrever-se na newsletter"
              onClick={async () => {
                if (!user) {
                  window.location.href = "/login"
                  return
                }
                const confirmSubscribe = window.confirm("Deseja inscrever-se nesta newsletter?")
                if (!confirmSubscribe) return
                // Assumindo que o slug é do autor; quando listando do próprio usuário, usar primeiro item
                const newsletterId = items?.[0]?.id
                if (!newsletterId) return
                await supabase.from("subscriptions").insert({ user_id: user.id, newsletter_id: newsletterId })
                alert("Inscrição realizada com sucesso!")
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* Ícone + apenas para logados */}
            {user && (
              <Link href="/create" className="text-white hover:text-gray-300" title="Criar Newsletter">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            )}
            <span className="text-white hidden md:block">{displayName}</span>
            <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white cursor-pointer"
                  style={{ verticalAlign: 'middle' }}
                />
              ) : (
                <span
                  className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-sm text-purple-700 border-2 border-white cursor-pointer font-bold"
                  style={{ verticalAlign: 'middle' }}
                >
                  {(displayName || "N").charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-6 top-16 w-44 bg-white border-2 border-black shadow-lg z-50">
                <Link href="/profile" className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200" onClick={() => setProfileDropdownOpen(false)}>Perfil</Link>
                {user && (
                  <Link href="/settings" className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200" onClick={() => setProfileDropdownOpen(false)}>Configurações</Link>
                )}
                <Link href="/subscriptions" className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200" onClick={() => setProfileDropdownOpen(false)}>Minhas inscrições</Link>
                <Link href="/" className="block px-4 py-3 text-black hover:bg-gray-100" onClick={() => setProfileDropdownOpen(false)}>Ver site</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Barra de busca */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar newsletters..."
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        {/* Categorias */}
        <div className="mb-8 relative">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="bg-black text-white px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            CATEGORIAS
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoriesOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-white border-2 border-black shadow-lg z-40">
              {["Todas", "Notícias", "Tecnologia", "Eventos"].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category === "Todas" ? null : category)
                    setCategoriesOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 ${
                    selectedCategory === category ? "bg-gray-100 font-semibold" : ""
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-6">Minhas newsletters</h2>
        {loading && <p>Carregando...</p>}
        {!loading && items.filter(i => (
          !searchTerm ||
          i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )).filter(i => (
          !selectedCategory || i.category === selectedCategory
        )).length === 0 && (
          <p className="text-gray-600">Nenhuma newsletter criada ainda.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.filter(n => (
            !searchTerm ||
            n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )).filter(n => (
            !selectedCategory || n.category === selectedCategory
          )).map((n) => (
            <div key={n.id} className="border-2 border-black p-4 bg-white transform transition-transform hover:shadow-xl hover:-translate-y-1">
              <div className="h-36 mb-3 border border-black overflow-hidden">
                <img src={n.image_url || "/placeholder.svg"} alt={n.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg md:text-xl">{n.title}</h3>
                <span className="text-gray-600 text-sm md:text-base">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm md:text-base text-gray-600 line-clamp-3 mb-3">{n.description}</p>
              <div className="flex items-center justify-between">
                <Link href={`/newsletter/${slug}/${n.id}`} className="inline-block px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors transform hover:shadow-sm hover:-translate-y-0.5">
                  Leia mais
                </Link>
                <span className="text-black text-sm md:text-base">{n.category || "Sem categoria"}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
