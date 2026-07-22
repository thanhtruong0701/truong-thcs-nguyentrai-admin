import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user-session')

    if (!sessionCookie) {
      return NextResponse.json({ role: 'student' })
    }

    const users = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, sessionCookie.value))
      .limit(1)

    return NextResponse.json({ role: users[0]?.role || 'student' })
  } catch {
    return NextResponse.json({ role: 'student' })
  }
}
