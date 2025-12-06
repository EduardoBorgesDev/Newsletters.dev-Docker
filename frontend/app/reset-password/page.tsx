"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    const hash = window.location.hash.replace('#', '')
    const params = new URLSearchParams(hash)
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setMessage(error.message)
          else setReady(true)
        })
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else setMessage("Abra o link de recuperação enviado ao seu e-mail.")
      })
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (password.length < 8) { setMessage("A senha deve ter ao menos 8 caracteres"); return }
    if (password !== confirm) { setMessage("As senhas não coincidem"); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      setMessage("Senha redefinida com sucesso. Redirecionando para o login...")
      setTimeout(() => router.replace('/login'), 1500)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-black px-6 py-4">
        <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide">NEWSLETTERS.dev</h1>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-8">Redefinir senha</h2>
          <form className="space-y-6" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium mb-2">Nova senha</label>
              <input type="password" className="w-full px-4 py-3 border-2 border-black" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar senha</label>
              <input type="password" className="w-full px-4 py-3 border-2 border-black" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
            </div>
            <button disabled={loading || !ready} className="w-full bg-black text-white py-3 font-medium hover:bg-gray-800 transition-colors">
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>
            {!ready && (
              <p className="text-sm text-center mt-2">Carregando sessão de recuperação...</p>
            )}
          </form>
          {message && <p className="mt-4 text-center">{message}</p>}
        </div>
      </main>
    </div>
  )
}
