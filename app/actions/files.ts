'use server'

import { db } from '@/lib/db'
import { fileUploads } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-helpers'
import { supabase } from '@/lib/supabase'

const ALLOWED_TYPES: Record<string, string> = {
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/pdf': 'pdf',
  'application/x-rar-compressed': 'rar',
  'application/vnd.rar': 'rar',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
}

export async function getFileUploads() {
  await requireAdmin()
  return db.select().from(fileUploads).orderBy(desc(fileUploads.createdAt))
}

export async function getPublishedFileUploads() {
  return db
    .select()
    .from(fileUploads)
    .where(eq(fileUploads.isPublished, true))
    .orderBy(desc(fileUploads.createdAt))
}

export async function getPublishedFilesByCategory(category: string) {
  return db
    .select()
    .from(fileUploads)
    .where(sql`${fileUploads.isPublished} = true AND ${fileUploads.category} = ${category}`)
    .orderBy(desc(fileUploads.createdAt))
}

export async function getFileCategories() {
  const result = await db
    .select({ category: fileUploads.category })
    .from(fileUploads)
    .where(eq(fileUploads.isPublished, true))
  const categories = [...new Set(result.map(r => r.category || 'general'))]
  return categories
}

export async function uploadFile(
  file: File,
  title: string,
  description: string,
  category: string,
  allowDownload: boolean = true
) {
  const currentUser = await requireAdmin()

  const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
  const mimeType = file.type
  const fileType = ALLOWED_TYPES[mimeType] || fileExt

  if (!ALLOWED_TYPES[mimeType]) {
    throw new Error('Loại file không được hỗ trợ. Chỉ chấp nhận: doc, docx, xls, xlsx, pdf, rar, zip')
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File quá lớn. Tối đa 50MB')
  }

  const filePath = `files/${crypto.randomUUID()}.${fileExt}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, buffer, { contentType: mimeType })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('materials')
    .getPublicUrl(filePath)

  const result = await db
    .insert(fileUploads)
    .values({
      id: crypto.randomUUID(),
      title,
      description: description || null,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      category: category || 'general',
      uploadedBy: currentUser.id,
      allowDownload,
      createdAt: new Date(),
    })
    .returning()

  revalidatePath('/admin/files')
  return result[0]
}

export async function updateFileUpload(
  id: string,
  data: {
    title?: string
    description?: string
    category?: string
    isPublished?: boolean
    allowDownload?: boolean
  }
) {
  await requireAdmin()

  const result = await db
    .update(fileUploads)
    .set(data)
    .where(eq(fileUploads.id, id))
    .returning()

  revalidatePath('/admin/files')
  return result[0]
}

export async function deleteFileUpload(id: string) {
  await requireAdmin()

  const file = await db.select().from(fileUploads).where(eq(fileUploads.id, id)).limit(1)
  if (file[0]) {
    const url = new URL(file[0].fileUrl)
    const storagePath = url.pathname.split('/').slice(-2).join('/')
    await supabase.storage.from('materials').remove([storagePath])
  }

  await db.delete(fileUploads).where(eq(fileUploads.id, id))
  revalidatePath('/admin/files')
}

export async function incrementDownloadCount(id: string) {
  const file = await db.select().from(fileUploads).where(eq(fileUploads.id, id)).limit(1)
  if (file[0]) {
    await db
      .update(fileUploads)
      .set({ downloadCount: (file[0].downloadCount || 0) + 1 })
      .where(eq(fileUploads.id, id))
  }
}

export async function uploadMultipleFiles(
  files: File[],
  category: string,
  allowDownload: boolean = true
) {
  const currentUser = await requireAdmin()
  const results = []

  for (const file of files) {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const mimeType = file.type
    const fileType = ALLOWED_TYPES[mimeType] || fileExt

    if (!ALLOWED_TYPES[mimeType]) {
      throw new Error(`File "${file.name}" có loại không được hỗ trợ. Chỉ chấp nhận: doc, docx, xls, xlsx, pdf, rar, zip`)
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File "${file.name}" quá lớn. Tối đa 50MB`)
    }

    const filePath = `files/${crypto.randomUUID()}.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, buffer, { contentType: mimeType })

    if (uploadError) {
      throw new Error(`Upload file "${file.name}" failed: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath)

    const title = file.name.replace(/\.[^/.]+$/, '')
    
    const result = await db
      .insert(fileUploads)
      .values({
        id: crypto.randomUUID(),
        title,
        description: null,
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        category: category || 'general',
        uploadedBy: currentUser.id,
        allowDownload,
        createdAt: new Date(),
      })
      .returning()

    results.push(result[0])
  }

  revalidatePath('/admin/files')
  return results
}
