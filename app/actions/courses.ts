'use server'

import { db } from '@/lib/db'
import { courses, lessons, materials, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth, requireTeacher } from '@/lib/auth-helpers'

export async function getPublishedCourses() {
  return db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.createdAt))
}

export async function getAllCourses() {
  await requireAdmin()

  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      gradeLevel: courses.gradeLevel,
      teacherId: courses.teacherId,
      isPublished: courses.isPublished,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      teacherName: user.name,
    })
    .from(courses)
    .leftJoin(user, eq(courses.teacherId, user.id))
    .orderBy(desc(courses.createdAt))
}

export async function getCourseById(id: string) {
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
  return course[0]
}

export async function getLessonsByCourse(courseId: string) {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.orderIndex)
}

export async function getMaterialsByLesson(lessonId: string) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.lessonId, lessonId))
    .orderBy(desc(materials.createdAt))
}

export async function createLesson(
  courseId: string,
  title: string,
  content: string,
  orderIndex: number
) {
  const currentUser = await requireAuth()

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!course || course.length === 0) {
    throw new Error('Course not found')
  }

  const isAdmin = currentUser.role === 'admin'
  if (!isAdmin && course[0].teacherId !== currentUser.id) {
    throw new Error('Unauthorized')
  }

  const lessonId = crypto.randomUUID()
  await db.insert(lessons).values({
    id: lessonId,
    courseId,
    title,
    content,
    orderIndex,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath(`/admin/courses/${courseId}`)
  return {
    id: lessonId,
    courseId,
    title,
    content,
    orderIndex,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getTeacherCourses(teacherId: string) {
  return db
    .select()
    .from(courses)
    .where(eq(courses.teacherId, teacherId))
    .orderBy(desc(courses.createdAt))
}

export async function createCourse(
  title: string,
  description?: string,
  gradeLevel?: number,
  teacherId?: string
) {
  const currentUser = await requireAuth()
  const userId = teacherId || currentUser.id

  const courseId = crypto.randomUUID()
  await db.insert(courses).values({
    id: courseId,
    title,
    description: description || '',
    gradeLevel,
    teacherId: userId,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/admin/courses')

  return {
    id: courseId,
    title,
    description: description || '',
    gradeLevel,
    teacherId: userId,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateCourse(
  id: string,
  data: {
    title?: string
    description?: string
    gradeLevel?: number
    isPublished?: boolean
  }
) {
  const currentUser = await requireAuth()

  const course = await db.select().from(courses).where(eq(courses.id, id))
  if (!course[0]) {
    throw new Error('Course not found')
  }

  const isAdmin = currentUser.role === 'admin'
  if (!isAdmin && course[0].teacherId !== currentUser.id) {
    throw new Error('Unauthorized - can only update own courses')
  }

  const result = await db
    .update(courses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning()

  revalidatePath('/admin/courses')
  return result[0]
}

export async function deleteCourse(id: string) {
  const currentUser = await requireAuth()

  const course = await db.select().from(courses).where(eq(courses.id, id))
  if (!course[0]) {
    throw new Error('Course not found')
  }

  const isAdmin = currentUser.role === 'admin'
  if (!isAdmin && course[0].teacherId !== currentUser.id) {
    throw new Error('Unauthorized - can only delete own courses')
  }

  await db.delete(courses).where(eq(courses.id, id))
  revalidatePath('/admin/courses')
}
