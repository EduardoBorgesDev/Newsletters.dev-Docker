import { supabase } from "./supabase"

export async function uploadNewsletterImage(newsletterId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `newsletter-${newsletterId}.${fileExt}`
  const filePath = `${fileName}`

  // Upload para o bucket
  const { error } = await supabase.storage
    .from('newsletters')
    .upload(filePath, file, { upsert: true })

  if (error) throw error

  // Gerar URL pública
  const { data: urlData } = supabase
    .storage
    .from('newsletters')
    .getPublicUrl(filePath)

  return urlData?.publicUrl
}
//att
