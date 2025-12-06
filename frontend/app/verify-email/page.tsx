"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const e = url.searchParams.get("email")
    setEmail(e)
    if (e) {
      // dispara o primeiro envio automaticamente
      handleResend(e, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  async function handleResend(address?: string | null, first = false) {
    const target = address ?? email
    if (!target) return
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: target })
      if (error) throw new Error(error.message)
      setMessage("E-mail enviado! Verifique sua caixa de entrada e spam.")
      setSecondsLeft(60)
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
        <div className="w-full max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Confirme seu e-mail</h2>
          <p className="mb-6">Enviamos um link de confirmação para {email ?? "seu e-mail"}.</p>
          <button
            disabled={secondsLeft > 0 || loading}
            onClick={() => handleResend()}
            className="w-full bg-black text-white py-3 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {secondsLeft > 0 ? `Reenviar em ${secondsLeft}s` : loading ? "Enviando..." : "Reenviar e-mail"}
          </button>
          {message && <p className="mt-4">{message}</p>}
          <p className="mt-6 text-sm text-gray-600">
            Já confirmou? <Link href="/login" className="underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
