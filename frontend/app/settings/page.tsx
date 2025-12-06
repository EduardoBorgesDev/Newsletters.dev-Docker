"use client"
import { useUser } from "../../hooks/useUser"

import type React from "react"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"

const backgroundColors = [
  { name: "Branco", value: "#ffffff" },
  { name: "Cinza Claro", value: "#f5f5f5" },
  { name: "Azul Claro", value: "#e3f2fd" },
  { name: "Verde Claro", value: "#e8f5e9" },
  { name: "Amarelo Claro", value: "#fffde7" },
  { name: "Rosa Claro", value: "#fce4ec" },
  { name: "Roxo Claro", value: "#f3e5f5" },
  { name: "Laranja Claro", value: "#fff3e0" },
]

export default function SettingsPage() {
  const { user, loading } = useUser()
  const safeName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email ?? "Usuário"
  })()
  const nameSlug = safeName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState("#ffffff")
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null)
  const [backgroundType, setBackgroundType] = useState<"color" | "image">("color")
  const profileRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      if (user) {
        const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()
        if (!error && data) {
          if (data.bg_type) setBackgroundType(data.bg_type)
          if (data.bg_color) setSelectedBackground(data.bg_color)
          if (data.bg_image_url) setBackgroundImagePreview(data.bg_image_url)
        }
      }
    }

    load()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBackgroundImageFile(file)
      setBackgroundType("image")
      const reader = new FileReader()
      reader.onloadend = () => {
        setBackgroundImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setBackgroundImageFile(null)
    setBackgroundImagePreview(null)
    setBackgroundType("color")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    try {
      // persist selection only to DB (no localStorage)

      let imageUrl: string | null = null

      if (backgroundType === "image" && backgroundImageFile && user) {
        // upload to storage bucket 'backgrounds' with filename user-<id>-bg-<timestamp>
        const ext = backgroundImageFile.name.split('.').pop()
        const fileName = `background-${user.id}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('backgrounds')
          .upload(fileName, backgroundImageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('backgrounds').getPublicUrl(fileName)
        imageUrl = urlData?.publicUrl || null
        // imageUrl saved to DB below
      } else {
        // no image selected
      }

      // persist user setting in user_settings table (upsert)
      if (user) {
        const payload = {
          user_id: user.id,
          bg_type: backgroundType,
          bg_color: backgroundType === 'color' ? selectedBackground : null,
          bg_image_url: backgroundType === 'image' ? imageUrl : null,
        }

        const { error: dbError } = await supabase.from('user_settings').upsert(payload, { returning: 'minimal' })
        if (dbError) throw dbError
      }

      alert('Configurações salvas com sucesso!')
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err)
      alert('Erro ao salvar configurações. Veja o console para detalhes.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link href={user ? `/newsletter/${nameSlug}` : "/"}>
            <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide cursor-pointer">NEWSLETTERS.dev</h1>
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-white hover:text-gray-300 flex items-center">
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
            <span className="text-white hidden md:block">{safeName}</span>
            <div className="relative flex items-center" ref={profileRef}>
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none flex items-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={safeName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer"
                    style={{ verticalAlign: 'middle' }}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg text-purple-700 border-2 border-white cursor-pointer font-bold"
                    style={{ verticalAlign: 'middle' }}
                  >
                    {safeName[0]?.toUpperCase()}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Configurações</h2>

        <div className="space-y-8">
          {/* Background Type Selection */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Tipo de Fundo</h3>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setBackgroundType("color")}
                className={`px-6 py-3 border-2 transition-all ${
                  backgroundType === "color"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black hover:bg-gray-100"
                }`}
              >
                Cor Sólida
              </button>
              <button
                onClick={() => setBackgroundType("image")}
                className={`px-6 py-3 border-2 transition-all ${
                  backgroundType === "image"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black hover:bg-gray-100"
                }`}
              >
                Imagem
              </button>
            </div>
          </section>

          {/* Background Color Section */}
          {backgroundType === "color" && (
            <section>
              <h3 className="text-xl font-semibold mb-4">Cor de Fundo da Página Principal</h3>
              <p className="text-gray-600 mb-4">
                Escolha uma cor de fundo para personalizar a aparência da sua página de newsletters.
              </p>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedBackground(color.value)}
                    className={`p-4 border-2 transition-all ${
                      selectedBackground === color.value ? "border-purple-600 ring-2 ring-purple-300" : "border-black"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {selectedBackground === color.value && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mx-auto text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium">Pré-visualização:</span>
                <div className="w-32 h-20 border-2 border-black" style={{ backgroundColor: selectedBackground }} />
                <span className="text-sm text-gray-600">
                  {backgroundColors.find((c) => c.value === selectedBackground)?.name}
                </span>
              </div>
            </section>
          )}

          {/* Background Image Section */}
          {backgroundType === "image" && (
            <section>
              <h3 className="text-xl font-semibold mb-4">Imagem de Fundo da Página Principal</h3>
              <p className="text-gray-600 mb-4">Selecione uma imagem do seu dispositivo para usar como fundo.</p>

              <div className="mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="bg-image-upload"
                />
                <label
                  htmlFor="bg-image-upload"
                  className="inline-block px-6 py-3 bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  Selecionar Imagem
                </label>
              </div>

              {backgroundImagePreview && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                  <div className="relative w-full h-48 border-2 border-black overflow-hidden">
                    <img
                      src={backgroundImagePreview || "/placeholder.svg"}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="mt-3 px-4 py-2 text-red-600 border border-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remover Imagem
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/"
              className="flex-1 px-6 py-3 border-2 border-black text-black text-center hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
