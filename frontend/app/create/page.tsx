"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { uploadNewsletterImage } from "../../lib/uploadNewsletterImage"
import Link from "next/link"
import { useUser } from "../../hooks/useUser"

const categories = ["Notícias", "Tecnologia", "Eventos"]

export default function CreateNewsletter() {
  const { user } = useUser()
  const userName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || "Usuário"
  })()
  const nameSlug = userName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

      const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      
      const { data: created, error } = await supabase
        .from("newsletters")
        .insert({
          title,
          description,
          category: selectedCategory,
          author_id: user!.id,
          author_name_slug: nameSlug
        })
        .select()
        .maybeSingle()
      if (error) {
        console.error("Erro ao criar newsletter:", error?.message || error)
        throw error
      }
      if (!created) {
        console.error("Nenhum dado retornado após insert. Verifique políticas RLS de select." )
        throw new Error("Erro ao criar newsletter")
      }

      
      let imageUrl = null
      if (imageFile) {
        try {
          imageUrl = await uploadNewsletterImage(created.id, imageFile)
          await supabase.from("newsletters").update({ image_url: imageUrl }).eq("id", created.id)
        } catch (imgErr: any) {
          console.error("Erro ao subir imagem da newsletter:", imgErr?.message || imgErr)
          throw imgErr
        }
      }

      alert("Newsletter criada com sucesso!")
      
    } catch (err: any) {
      alert(`Erro ao criar newsletter${err?.message ? ": " + err.message : ""}`)
    } finally {
      setLoading(false)
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
            {user && <span className="text-white hidden md:block">{userName}</span>}
            <div className="relative flex items-center" ref={profileRef}>
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none flex items-center">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer"
                    style={{ verticalAlign: 'middle' }}
                  />
                ) : (
                  <span
                    className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg text-purple-700 border-2 border-white cursor-pointer font-bold"
                    style={{ verticalAlign: 'middle' }}
                  >
                    {userName[0]?.toUpperCase() || "N"}
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
        <h2 className="text-3xl font-bold mb-8 text-center">Criar Newsletter</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Título da Newsletter
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Digite o título..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Descreva sua newsletter..."
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Imagem da Newsletter</label>
            <div className="border-2 border-dashed border-black p-8 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-48 mx-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="mt-4 text-red-600 hover:text-red-800"
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-600">Clique para fazer upload</span>
                    <span className="text-gray-400 text-sm mt-1">PNG, JPG até 5MB</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/"
              className="flex-1 px-6 py-3 border-2 border-black text-black text-center hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button type="submit" className="flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors">
              {loading ? "Criando..." : "Criar Newsletter"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}