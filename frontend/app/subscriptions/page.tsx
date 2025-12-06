"use client"
"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"
import { useUser } from "../../hooks/useUser"

export default function SubscriptionsPage() {
  const { user, loading: userLoading } = useUser()
  const isAuthenticated = !!user
  const userId = user?.id
  const userName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || "Usuário"
  })()
  const avatarUrl = user?.user_metadata?.avatar_url || null
  const nameSlug = userName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  const [tab, setTab] = useState("inscritos")
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = React.useRef<HTMLDivElement>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  useEffect(() => {
    async function fetchSubscriptions() {
      setLoading(true)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, newsletter:newsletter_id(title, author_id)")
        .eq("user_id", userId)
      if (!error && data) setSubscriptions(data)
      setLoading(false)
    }
    if (isAuthenticated) fetchSubscriptions()
  }, [tab, isAuthenticated, userId])

  async function handleRemove(subscriptionId: string) {
    await supabase.from("subscriptions").delete().eq("id", subscriptionId)
    setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId))
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link href={user ? `/newsletter/${nameSlug}` : "/"}>
            <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide cursor-pointer">NEWSLETTERS.dev</h1>
          </Link>
          <div className="relative flex items-center" ref={profileRef}>
            {isAuthenticated && (
              <>
                <span className="text-white hidden md:block mr-3">{userName}</span>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer"
                    style={{ verticalAlign: 'middle' }}
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg text-purple-700 border-2 border-white cursor-pointer font-bold"
                    style={{ verticalAlign: 'middle' }}
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    {userName[0]?.toUpperCase() || "N"}
                  </span>
                )}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full w-44 bg-white border-2 border-black shadow-lg z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Configurações
                    </Link>
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
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8">Minhas Inscrições</h2>
        <div className="flex gap-4 mb-8">
          <button
            className={`px-4 py-2 border-b-2 font-semibold ${tab === "inscritos" ? "border-black" : "border-transparent"}`}
            onClick={() => setTab("inscritos")}
          >
            Meus inscritos
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-semibold ${tab === "seguindo" ? "border-black" : "border-transparent"}`}
            onClick={() => setTab("seguindo")}
          >
            Inscrições
          </button>
        </div>
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Carregando...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">Nenhuma inscrição encontrada.</div>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="border-2 border-black p-4 flex justify-between items-center">
                <span>{sub.newsletter?.title || "Newsletter"}</span>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-800"
                  onClick={() => handleRemove(sub.id)}
                >
                  Remover inscrição
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
