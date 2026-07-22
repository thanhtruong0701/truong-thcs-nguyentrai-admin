'use server'

import { db } from '@/lib/db'
import { materials, lessons } from '@/lib/db/schema'
import { supabase } from '@/lib/supabase'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-helpers'

export async function uploadMaterial(
  lessonId: string,
  file: File,
  title: string
) {
  const currentUser = await requireAuth()

  const lesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1)

  if (!lesson || lesson.length === 0) {
    throw new Error('Lesson not found')
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `materials/${crypto.randomUUID()}.${fileExt}`

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

  const materialId = crypto.randomUUID()
  await db.insert(materials).values({
    id: materialId,
    lessonId,
    title,
    fileUrl: urlData.publicUrl,
    fileType: file.type,
    fileSize: file.size,
    uploadedBy: currentUser.id,
    createdAt: new Date(),
  })

  revalidatePath(`/admin/courses/${lesson[0].courseId}`)

  return { url: urlData.publicUrl, id: materialId }
}

export async function getMaterialsByLesson(lessonId: string) {
  const result = await db
    .select()
    .from(materials)
    .where(eq(materials.lessonId, lessonId))

  return result
}

export async function deleteMaterial(materialId: string) {
  const currentUser = await requireAuth()

  const material = await db
    .select()
    .from(materials)
    .where(eq(materials.id, materialId))
    .limit(1)

  if (!material || material.length === 0) {
    throw new Error('Material not found')
  }

  if (material[0].uploadedBy !== currentUser.id) {
    throw new Error('Unauthorized')
  }

  await db.delete(materials).where(eq(materials.id, materialId))

  revalidatePath(`/admin/courses`)

  return { success: true }
}
