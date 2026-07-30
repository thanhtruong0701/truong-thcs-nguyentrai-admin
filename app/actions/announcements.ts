'use server'

import { db } from '@/lib/db'
import { announcements } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'
import { supabase } from '@/lib/supabase'

export async function getAnnouncements() {
  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.isPinned), desc(announcements.pinOrder), desc(announcements.createdAt))
}

export async function getAnnouncementById(id: string) {
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1)
  return result[0] || null
}

export async function getPinnedAnnouncements() {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.isPinned, true))
    .orderBy(desc(announcements.pinOrder), desc(announcements.createdAt))
}

export async function uploadAnnouncementImage(file: File) {
  const currentUser = await requireAuth()

  const fileExt = file.name.split('.').pop()
  const filePath = `announcements/${crypto.randomUUID()}.${fileExt}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('materials')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function uploadAnnouncementFile(file: File) {
  const currentUser = await requireAuth()

  const fileExt = file.name.split('.').pop()
  const filePath = `announcements/files/${crypto.randomUUID()}.${fileExt}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('materials')
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl, name: file.name, type: file.type }
}

export async function createAnnouncement(data: {
  title: string
  content: string
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  images?: string
  files?: string
}) {
  const currentUser = await requireAuth()

  if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
    throw new Error('Unauthorized - only admin and teachers can create announcements')
  }

  const result = await db
    .insert(announcements)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl || null,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      fileType: data.fileType || null,
      images: data.images || null,
      files: data.files || null,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function updateAnnouncement(
  id: string,
  data: {
    title?: string
    content?: string
    imageUrl?: string
    fileUrl?: string
    fileName?: string
    fileType?: string
    images?: string
    files?: string
    isPinned?: boolean
  }
) {
  await requireAdmin()

  const result = await db
    .update(announcements)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id))
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function deleteAnnouncement(id: string) {
  await requireAdmin()

  await db.delete(announcements).where(eq(announcements.id, id))
  revalidatePath('/admin')
}

export async function togglePinAnnouncement(id: string, isPinned: boolean) {
  await requireAdmin()

  const pinOrder = isPinned ? Date.now() : 0

  const result = await db
    .update(announcements)
    .set({
      isPinned,
      pinOrder,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id))
    .returning()

  revalidatePath('/admin')
  return result[0]
}
