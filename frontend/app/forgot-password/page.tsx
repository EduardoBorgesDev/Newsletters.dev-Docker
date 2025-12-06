"use client"
import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setResetLink(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw new Error(error.message)
      setMessage("Se o e-mail existir, enviamos o link de redefinição.")
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
          <h2 className="text-3xl font-bold text-center mb-8">Esqueci minha senha</h2>
          <form className="space-y-6" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">E-mail</label>
              <input id="email" type="email" className="w-full px-4 py-3 border-2 border-black" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full bg-black text-white py-3 font-medium hover:bg-gray-800 transition-colors">
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
          {message && <p className="mt-4 text-center">{message}</p>}
          {resetLink && null}
        </div>
      </main>
    </div>
  )
}
//att