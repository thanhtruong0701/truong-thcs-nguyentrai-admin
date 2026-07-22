import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getCustomSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user-session')?.value
  const role = cookieStore.get('user-role')?.value

  if (!sessionId) return null

  const users = await db
    .select()
    .from(user)
    .where(eq(user.id, sessionId))
    .limit(1)

  if (users.length === 0) return null

  return {
    user: {
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      role: users[0].role || role || 'student',
    },
  }
}

export async function requireAuth() {
  const session = await getCustomSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Unauthorized - admin only')
  }
  return user
}

export async function requireTeacher() {
  const user = await requireAuth()
  if (user.role !== 'teacher' && user.role !== 'admin') {
    throw new Error('Unauthorized - teacher only')
  }
  return user
}
