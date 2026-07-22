'use server'

import { db } from '@/lib/db'
import { pages, menuItems } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth } from '@/lib/auth-helpers'
import { supabase } from '@/lib/supabase'

export async function uploadPageImage(file: File) {
  await requireAuth()

  const fileExt = file.name.split('.').pop()
  const filePath = `pages/${crypto.randomUUID()}.${fileExt}`

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

export async function uploadPageFile(file: File) {
  await requireAuth()

  const fileExt = file.name.split('.').pop()
  const filePath = `pages/files/${crypto.randomUUID()}.${fileExt}`

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

export async function getPages() {
  await requireAdmin()
  return db
    .select({
      id: pages.id,
      menuItemId: pages.menuItemId,
      title: pages.title,
      content: pages.content,
      imageUrl: pages.imageUrl,
      fileUrl: pages.fileUrl,
      fileName: pages.fileName,
      fileType: pages.fileType,
      files: pages.files,
      isPublished: pages.isPublished,
      createdBy: pages.createdBy,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
      menuLabel: menuItems.label,
    })
    .from(pages)
    .leftJoin(menuItems, eq(pages.menuItemId, menuItems.id))
    .orderBy(desc(pages.createdAt))
}

export async function getPagesByMenuItem(menuItemId: string) {
  await requireAdmin()
  return db
    .select()
    .from(pages)
    .where(eq(pages.menuItemId, menuItemId))
    .orderBy(desc(pages.createdAt))
}

export async function getPageById(id: string) {
  await requireAdmin()
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1)
  return result[0] || null
}

export async function createPage(data: {
  menuItemId: string | null
  title: string
  content: string
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  files?: string
}) {
  const currentUser = await requireAdmin()

  const result = await db
    .insert(pages)
    .values({
      id: crypto.randomUUID(),
      menuItemId: data.menuItemId || null,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl || null,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      fileType: data.fileType || null,
      files: data.files || null,
      isPublished: true,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/admin/pages')
  return result[0]
}

export async function updatePage(
  id: string,
  data: {
    menuItemId?: string | null
    title?: string
    content?: string
    imageUrl?: string
    fileUrl?: string
    fileName?: string
    fileType?: string
    files?: string
    isPublished?: boolean
  }
) {
  await requireAdmin()

  const result = await db
    .update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning()

  revalidatePath('/admin/pages')
  return result[0]
}

export async function deletePage(id: string) {
  await requireAdmin()
  await db.delete(pages).where(eq(pages.id, id))
  revalidatePath('/admin/pages')
}
