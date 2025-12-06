"use client"
import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { supabase } from "../lib/supabase"
import { useUser } from "../hooks/useUser"

// Hook de autenticação real


// Modal de inscrição
function ConfirmSubscribeModal({ open, onClose, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded shadow-lg max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4">Deseja inscrever-se na newsletter deste usuário?</h2>
        <div className="flex gap-4 justify-center mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 bg-black text-white rounded" onClick={onConfirm}>Sim, inscrever-se</button>
        </div>
      </div>
    </div>
  )
}

const categories = ["Todas", "Notícias", "Tecnologia", "Eventos"]

export default function Home() {
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [searchTerm, setSearchTerm] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundType, setBackgroundType] = useState<"color" | "image">("color")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [newsletters, setNewsletters] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<any>(null)

  const { user, loading } = useUser()
  const isAuthenticated = !!user
  const userId = user?.id
  const formattedName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || ""
  })()
  const nameSlug = formattedName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")

  const carouselRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/login"
    }
  }, [loading, isAuthenticated])

  useEffect(() => {
    const load = async () => {
      // If user logged in, load their settings from DB
      try {
        if (user) {
          const { data: settings, error: settingsErr } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()
          if (!settingsErr && settings) {
            if (settings.bg_type) setBackgroundType(settings.bg_type)
            if (settings.bg_color) setBackgroundColor(settings.bg_color)
            if (settings.bg_image_url) setBackgroundImage(settings.bg_image_url)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar user settings:', err)
      }

      // Buscar newsletters do Supabase
      async function fetchNewsletters() {
        const { data, error } = await supabase
          .from("newsletters")
          .select("id,title,description,image_url,alt,category,created_at")
          .order("created_at", { ascending: false })
        if (!error && data) setNewsletters(data)
      }
      fetchNewsletters()
    }
    load()
  }, [])

  const filteredNewsletters = newsletters.filter((n) => {
    const matchesCategory = selectedCategory === "Todas" || n.category === selectedCategory
    const matchesSearch =
      searchTerm === "" ||
      n.alt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const visibleCount = 3
  const maxIndex = Math.max(0, filteredNewsletters.length - visibleCount)

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedCategory, searchTerm])

  const backgroundStyle =
    backgroundType === "image" && backgroundImage
      ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }
      : { backgroundColor }

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      {/* Overlay for image background */}
      {backgroundType === "image" && backgroundImage && <div className="fixed inset-0 bg-white/70 -z-10" />}

      {/* Header */}
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link href={isAuthenticated ? `/newsletter/${nameSlug}` : "/"}>
            <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide cursor-pointer">NEWSLETTERS.dev</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link href="/create" className="text-white hover:text-gray-300 text-2xl font-bold" title="Criar Newsletter">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            )}
            {/* Notificação/Inscrição */}
            <button className="text-white hover:text-gray-300 flex items-center" onClick={() => setModalOpen(true)} title="Inscrever-se na newsletter">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <ConfirmSubscribeModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onConfirm={async () => {
                if (!selectedNewsletter) return
                if (!isAuthenticated) {
                  setModalOpen(false)
                  window.location.href = "/login"
                  return
                }
                await supabase.from("subscriptions").insert({ user_id: userId, newsletter_id: selectedNewsletter.id })
                setModalOpen(false)
                alert("Inscrição realizada com sucesso!")
              }}
            />
            {isAuthenticated && (
              <span className="text-white hidden md:block">{formattedName}</span>
            )}
            <div className="relative flex items-center" ref={profileRef}>
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none flex items-center">
                {isAuthenticated && user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.name || user.email}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer"
                    style={{ verticalAlign: 'middle' }}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg text-purple-700 border-2 border-white cursor-pointer font-bold"
                    style={{ verticalAlign: 'middle' }}
                  >
                    {isAuthenticated && (formattedName ? formattedName[0].toUpperCase() : user?.email?.[0]?.toUpperCase()) || "N"}
                  </span>
                )}
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full w-44 bg-white border-2 border-black shadow-lg z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Perfil
                  </Link>
                  {isAuthenticated && (
                    <Link
                      href="/settings"
                      className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Configurações
                    </Link>
                  )}
                  <Link
                    href="/subscriptions"
                    className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Minhas inscrições
                  </Link>
                  <Link
                    href="/"
                    className="block px-4 py-3 text-black hover:bg-gray-100"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Ver site
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-center mb-16 mt-12">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar newsletters..."
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-8 relative" ref={categoriesRef}>
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="bg-black text-white px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            CATEGORIAS
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoriesOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-white border-2 border-black shadow-lg z-40">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category)
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

        <div className="relative">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
              aria-label="Anterior"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={carouselRef}
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex gap-6 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * (320 + 24)}px)` }}
            >
              {filteredNewsletters.map((newsletter) => (
                <article key={newsletter.id} className="border-2 border-black shrink-0 w-80 bg-white">
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <img
                      src={newsletter.image || "/placeholder.svg"}
                      alt={newsletter.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-justify mb-3">{newsletter.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">{newsletter.date}</p>
                      <Link
                        href={`/newsletter/${newsletter.slug}`}
                        className="text-sm font-medium px-3 py-1 border border-black hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
                      >
                        Leia mais
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
              aria-label="Próximo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {filteredNewsletters.length > visibleCount && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentIndex === index ? "bg-black" : "bg-gray-300"
                }`}
                aria-label={`Ir para página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
//att
