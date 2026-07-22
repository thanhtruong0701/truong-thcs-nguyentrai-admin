import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check if admin already exists
    const existing = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, 'admin'))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Admin account already exists', success: false },
        { status: 400 }
      )
    }

    // Create admin user
    const adminId = `admin-${Date.now()}`
    
    await db.insert(userTable).values({
      id: adminId,
      email: 'admin',
      name: 'Quản trị viên',
      emailVerified: true,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Admin account created successfully',
        credentials: {
          username: 'admin',
          password: '123',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Admin creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin account', success: false },
      { status: 500 }
    )
  }
}
