import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Update user role to admin
    const result = await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.id, userId))
      .returning()

    console.log('[v0] Updated user role to admin:', result)

    return NextResponse.json({
      success: true,
      message: 'Admin role set successfully',
      user: result[0]
    })
  } catch (error) {
    console.error('[v0] Error setting admin role:', error)
    return NextResponse.json(
      { error: 'Failed to set admin role', details: String(error) },
      { status: 500 }
    )
  }
}
