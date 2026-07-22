import { NextResponse } from 'next/server'
import { createAdminAccount, seedDefaultData } from '@/app/actions/admin-seed'

export async function POST(req: Request) {
  try {
    const adminResult = await createAdminAccount()
    const seedResult = await seedDefaultData()

    return NextResponse.json({
      success: true,
      admin: adminResult,
      seed: seedResult,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed data', details: String(error) },
      { status: 500 }
    )
  }
}
