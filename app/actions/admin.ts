'use server'

import { db } from '@/lib/db'
import { user, menuItems, teacherPermissions, announcements, courses, lessons, account, fileUploads, quizzes, pages } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { requireAdmin, requireAuth } from '@/lib/auth-helpers'

export async function getDashboardStats() {
  await requireAdmin()
  const [annCount] = await db.select({ count: count() }).from(announcements)
  const [courseCount] = await db.select({ count: count() }).from(courses)
  const [userCount] = await db.select({ count: count() }).from(user)
  const [lessonCount] = await db.select({ count: count() }).from(lessons)
  const [fileCount] = await db.select({ count: count() }).from(fileUploads)
  const [quizCount] = await db.select({ count: count() }).from(quizzes)
  const [pageCount] = await db.select({ count: count() }).from(pages)
  return {
    announcements: Number(annCount?.count ?? 0),
    courses: Number(courseCount?.count ?? 0),
    users: Number(userCount?.count ?? 0),
    lessons: Number(lessonCount?.count ?? 0),
    files: Number(fileCount?.count ?? 0),
    quizzes: Number(quizCount?.count ?? 0),
    pages: Number(pageCount?.count ?? 0),
  }
}

export async function getAllUsers() {
  await requireAdmin()
  return db.select().from(user).orderBy(desc(user.createdAt))
}

export async function getTeachers() {
  await requireAdmin()
  return db.select().from(user).where(eq(user.role, 'teacher')).orderBy(desc(user.createdAt))
}

export async function getStudents() {
  await requireAdmin()
  return db.select().from(user).where(eq(user.role, 'student')).orderBy(desc(user.createdAt))
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'teacher' | 'student') {
  await requireAdmin()

  if (!userId || !newRole) {
    throw new Error('Invalid parameters')
  }

  const result = await db
    .update(user)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function deleteUser(userId: string) {
  await requireAdmin()

  await db.delete(user).where(eq(user.id, userId))
  revalidatePath('/admin')
}

export async function getMenuItems() {
  return db.select().from(menuItems).orderBy(menuItems.orderIndex)
}

export async function createMenuItem(data: {
  label: string
  link: string
  orderIndex?: number
}) {
  await requireAdmin()

  const result = await db
    .insert(menuItems)
    .values({
      id: crypto.randomUUID(),
      label: data.label,
      link: data.link,
      orderIndex: data.orderIndex || 0,
    })
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function updateMenuItem(
  id: string,
  data: {
    label?: string
    link?: string
    orderIndex?: number
    isVisible?: boolean
  }
) {
  await requireAdmin()

  const result = await db
    .update(menuItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(menuItems.id, id))
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function deleteMenuItem(id: string) {
  await requireAdmin()

  await db.delete(menuItems).where(eq(menuItems.id, id))
  revalidatePath('/admin')
}

export async function grantTeacherPermission(data: {
  teacherId: string
  courseId: string
  canEdit?: boolean
  canUpload?: boolean
  canPublish?: boolean
}) {
  await requireAdmin()

  const result = await db
    .insert(teacherPermissions)
    .values({
      id: crypto.randomUUID(),
      teacherId: data.teacherId,
      courseId: data.courseId,
      canEdit: data.canEdit,
      canUpload: data.canUpload,
      canPublish: data.canPublish,
    })
    .returning()

  revalidatePath('/admin')
  return result[0]
}

export async function revokeTeacherPermission(id: string) {
  await requireAdmin()

  await db.delete(teacherPermissions).where(eq(teacherPermissions.id, id))
  revalidatePath('/admin')
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: 'admin' | 'teacher' | 'student'
}) {
  await requireAdmin()

  const userId = crypto.randomUUID()
  const hashedPassword = await bcrypt.hash(data.password, 10)

  await db.insert(user).values({
    id: userId,
    email: data.email,
    name: data.name,
    emailVerified: true,
    role: data.role,
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: hashedPassword,
  })

  revalidatePath('/admin/users')
  return { id: userId }
}
