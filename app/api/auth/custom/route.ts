import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user as userTable, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '123'

export async function POST(req: NextRequest) {
  try {
    const { mode, username, password, name } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Tài khoản và mật khẩu là bắt buộc' },
        { status: 400 }
      )
    }

    if (mode === 'sign-in') {
      try {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          let adminUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, 'admin'))
            .limit(1)

          if (adminUser.length === 0) {
            const adminId = crypto.randomUUID()
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

            await db.insert(userTable).values({
              id: adminId,
              email: 'admin',
              name: 'Quản trị viên',
              emailVerified: true,
              role: 'admin',
              createdAt: new Date(),
              updatedAt: new Date(),
            })

            await db.insert(account).values({
              id: crypto.randomUUID(),
              accountId: 'admin',
              providerId: 'credential',
              userId: adminId,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            })

            adminUser = [{
              id: adminId,
              email: 'admin',
              name: 'Quản trị viên',
              emailVerified: true,
              role: 'admin',
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }]
          }

          const user = adminUser[0]
          const response = NextResponse.json(
            {
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
            },
            { status: 200 }
          )

          response.cookies.set({
            name: 'user-session',
            value: user.id,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })

          response.cookies.set({
            name: 'user-role',
            value: user.role,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })

          return response
        }

        const users = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, username))
          .limit(1)

        if (users.length === 0) {
          return NextResponse.json(
            { error: 'Tài khoản hoặc mật khẩu không đúng' },
            { status: 401 }
          )
        }

        const user = users[0]

        const accountData = await db
          .select()
          .from(account)
          .where(eq(account.userId, user.id))
          .limit(1)

        if (accountData.length === 0) {
          return NextResponse.json(
            { error: 'Tài khoản hoặc mật khẩu không đúng' },
            { status: 401 }
          )
        }

        const storedPassword = accountData[0].password
        if (!storedPassword) {
          return NextResponse.json(
            { error: 'Tài khoản hoặc mật khẩu không đúng' },
            { status: 401 }
          )
        }

        const valid = await bcrypt.compare(password, storedPassword)
        if (!valid) {
          return NextResponse.json(
            { error: 'Tài khoản hoặc mật khẩu không đúng' },
            { status: 401 }
          )
        }

        const response = NextResponse.json(
          {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          },
          { status: 200 }
        )

        response.cookies.set({
          name: 'user-session',
          value: user.id,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })

        response.cookies.set({
          name: 'user-role',
          value: user.role || 'student',
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })

        return response
      } catch (error) {
        console.error('Sign-in error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    } else if (mode === 'sign-up') {
      try {
        const existing = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, username))
          .limit(1)

        if (existing.length > 0) {
          return NextResponse.json(
            { error: 'Tài khoản này đã tồn tại' },
            { status: 400 }
          )
        }

        const userId = crypto.randomUUID()
        const hashedPassword = await bcrypt.hash(password, 10)

        await db.insert(userTable).values({
          id: userId,
          email: username,
          name: name || username,
          emailVerified: false,
          role: 'student',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await db.insert(account).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const response = NextResponse.json(
          {
            success: true,
            user: {
              id: userId,
              email: username,
              name: name || username,
              role: 'student',
            },
          },
          { status: 201 }
        )

        response.cookies.set({
          name: 'user-session',
          value: userId,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })

        response.cookies.set({
          name: 'user-role',
          value: 'student',
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })

        return response
      } catch (error) {
        console.error('Sign-up error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid mode' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
