import { supabase } from "./supabase"

export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  const filePath = `${fileName}`

  // Upload para o bucket
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (error) throw error

  // Gerar URL pública
  const { data: urlData } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath)

  const publicUrl = urlData?.publicUrl

  // Atualiza metadados do usuário autenticado
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl }
  })

  return publicUrl
}
//att
