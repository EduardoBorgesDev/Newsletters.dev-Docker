"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FaLinkedin, FaYoutube, FaInstagram, FaPen } from "react-icons/fa"
import { useState, useEffect, useRef } from "react"
import { uploadAvatar } from "../../lib/uploadAvatar"
import { useUser } from "../../hooks/useUser"
import { supabase } from "../../lib/supabase"

export default function ProfilePage() {
  const { user, loading, refresh, setUser } = useUser()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [linkedin, setLinkedin] = useState("https://linkedin.com")
  const [youtube, setYoutube] = useState("https://youtube.com")
  const [instagram, setInstagram] = useState("https://instagram.com")
  const [description, setDescription] = useState("") // Novo estado para descrição
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url || null)
      setName(user.user_metadata?.name || user.email || "")
      setBio(user.user_metadata?.bio || "")
      setLinkedin(
        typeof user.user_metadata?.linkedin === "string" && user.user_metadata.linkedin.trim() !== ""
          ? user.user_metadata.linkedin
          : "https://linkedin.com"
      )
      setYoutube(
        typeof user.user_metadata?.youtube === "string" && user.user_metadata.youtube.trim() !== ""
          ? user.user_metadata.youtube
          : "https://youtube.com"
      )
      setInstagram(
        typeof user.user_metadata?.instagram === "string" && user.user_metadata.instagram.trim() !== ""
          ? user.user_metadata.instagram
          : "https://instagram.com"
      )
      setDescription(user.user_metadata?.description || "") // Atualiza o estado da descrição
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  const userName = (() => {
    const name = user?.user_metadata?.name as string | undefined
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
      return parts[0]
    }
    return user?.email || "Usuário"
  })()
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xl text-gray-500">Carregando perfil...</span>
      </div>
    )
  }

  // Atualizei a lógica de persistência e correção de erros para os links sociais e outros estados.
  const handleSave = async () => {
    setSaving(true);

    const updates = {
      name,
      bio,
      avatar_url: avatarUrl,
      linkedin,
      youtube,
      instagram,
      description,
    };

    console.log("Atualizando com os seguintes dados:", updates);

    try {
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error("Erro ao salvar perfil:", error.message);
        return;
      }

      console.log("Dados atualizados com sucesso:", updatedUser);

      await refresh();

      setUser((prev) => ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          ...updates,
        },
      }));

      console.log("Estado atualizado após refresh.");
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black px-6 py-4 flex items-center justify-between">
        <Link href={!!user ? `/newsletter/${(user?.user_metadata?.name || user?.email || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-")}` : "/"}>
          <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide">NEWSLETTERS.dev</h1>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white hidden md:block">{userName}</span>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none flex items-center">
              {user?.user_metadata?.avatar_url || avatarUrl ? (
                <img
                  src={user?.user_metadata?.avatar_url || avatarUrl || ''}
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
              <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-black shadow-lg z-50">
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
                <a
                  href="#"
                  className="block px-4 py-3 text-black hover:bg-gray-100"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Ver site
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Avatar dinâmico com upload */}
        <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center mb-8 relative cursor-pointer"
          style={{ background: avatarUrl ? 'none' : '#E9D5FF' }}
          onClick={() => {
            if (!uploading) document.getElementById('avatar-upload')?.click();
          }}
          title={uploading ? 'Enviando...' : 'Alterar foto'}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-7xl text-purple-700 font-bold">{name[0]?.toUpperCase() || "N"}</span>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !user) return
              setUploading(true)
              try {
                const url = await uploadAvatar(user.id, file)
                setAvatarUrl(url)
                await refresh()
              } catch (err) {
                alert("Erro ao enviar avatar")
              } finally {
                setUploading(false)
              }
            }}
          />
          {uploading && (
            <span className="absolute bottom-2 right-2 bg-black text-white px-3 py-1 rounded text-xs">Enviando...</span>
          )}
        </div>
        {/* Name */}
        <div className="flex items-center gap-2 mb-6">
          {editMode ? (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-3xl md:text-4xl font-semibold border-b border-black focus:outline-none mb-2"
            />
          ) : (
            <h2 className="text-3xl md:text-4xl font-semibold">{user?.user_metadata?.name || name}</h2>
          )}
          {!!user && !editMode && (
            <button title="Editar perfil" className="ml-2 text-gray-500 hover:text-black" onClick={() => setEditMode(true)}>
              <FaPen size={24} />
            </button>
          )}
        </div>

        {/* Bio Box */}
          <div className="border-2 border-black p-6 w-full max-w-2xl mb-8" style={{maxWidth: '700px', margin: '0 auto'}}>
            {editMode ? (
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full text-lg p-2 resize-none border-none text-center"
                style={{ minHeight: '40px', height: '60px' }}
                rows={2}
              />
            ) : (
              <p className="text-center text-lg m-0">{user?.user_metadata?.bio || bio}</p>
            )}
          </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-6 mt-8 mb-4">
          {editMode ? (
            <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
              <div className="flex items-center gap-2 w-full max-w-xs">
                <FaLinkedin size={32} color="#0077B5" />
                <input
                  type="text"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  placeholder="LinkedIn URL"
                  className="border border-black p-2 rounded w-full focus:border-2 focus:border-black transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <FaYoutube size={32} color="#FF0000" />
                <input
                  type="text"
                  value={youtube}
                  onChange={e => setYoutube(e.target.value)}
                  placeholder="YouTube URL"
                  className="border border-black p-2 rounded w-full focus:border-2 focus:border-black transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <FaInstagram size={32} color="#C13584" />
                <input
                  type="text"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  placeholder="Instagram URL"
                  className="border border-black p-2 rounded w-full focus:border-2 focus:border-black transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <a href={(user?.user_metadata?.linkedin as string) || linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <FaLinkedin size={56} color="#0077B5" />
              </a>
              <a href={(user?.user_metadata?.youtube as string) || youtube} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <FaYoutube size={56} color="#FF0000" />
              </a>
              <a href={(user?.user_metadata?.instagram as string) || instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <FaInstagram size={56} color="#C13584" />
              </a>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {editMode && (
          <button
            className="mt-6 bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
        <Link href="/login" className="mt-12 bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors">
          Sair da Conta
        </Link>

        {/* Newsletters removed from profile as requested */}
      </main>
    </div>
  )
}
//att
