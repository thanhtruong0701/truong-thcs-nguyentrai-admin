import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: 'user-session',
    value: '',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: 'user-role',
    value: '',
    path: '/',
    maxAge: 0,
  })

  return response
}
