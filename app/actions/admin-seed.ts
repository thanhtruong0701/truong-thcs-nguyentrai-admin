'use server'

import { db } from '@/lib/db'
import { user as userTable, account, menuItems, settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function createAdminAccount() {
  try {
    const adminEmail = 'admin@truongnguyen.edu.vn'
    const adminPassword = 'Admin@123456'
    const adminName = 'Quản trị viên'

    const existing = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, adminEmail))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: true,
        message: 'Tài khoản admin đã tồn tại',
        email: adminEmail,
      }
    }

    const adminId = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await db.insert(userTable).values({
      id: adminId,
      email: adminEmail,
      emailVerified: true,
      name: adminName,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: adminEmail,
      providerId: 'credential',
      userId: adminId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return {
      success: true,
      message: 'Tài khoản admin được tạo thành công',
      email: adminEmail,
    }
  } catch (error) {
    console.error('Admin seed error:', error)
    return {
      success: false,
      message: 'Lỗi khi tạo tài khoản admin',
      error: String(error),
    }
  }
}

export async function seedDefaultData() {
  try {
    // Seed default menu items
    const existingMenu = await db.select().from(menuItems).limit(1)
    if (existingMenu.length === 0) {
      await db.insert(menuItems).values([
        { id: crypto.randomUUID(), label: 'Trang chủ', link: '/', orderIndex: 1, isVisible: true },
        { id: crypto.randomUUID(), label: 'Khóa học', link: '/courses', orderIndex: 2, isVisible: true },
        { id: crypto.randomUUID(), label: 'Thông báo', link: '/#announcements', orderIndex: 3, isVisible: true },
        { id: crypto.randomUUID(), label: 'Liên hệ', link: '/contact', orderIndex: 4, isVisible: true },
      ])
    }

    // Seed default settings
    const existingSettings = await db.select().from(settings).limit(1)
    if (existingSettings.length === 0) {
      await db.insert(settings).values([
        { id: crypto.randomUUID(), key: 'school_name', value: 'Trường THCS Nguyễn Trãi' },
        { id: crypto.randomUUID(), key: 'school_address', value: 'Quận Gò Vấp, TP. HCM' },
        { id: crypto.randomUUID(), key: 'school_phone', value: '(028) 3842-5904' },
        { id: crypto.randomUUID(), key: 'school_email', value: 'info@truongnguyen.edu.vn' },
        { id: crypto.randomUUID(), key: 'school_website', value: 'https://thcsnguyentraigovap.hcm.edu.vn' },
        { id: crypto.randomUUID(), key: 'school_principal', value: 'ThS. Trần Văn A' },
        { id: crypto.randomUUID(), key: 'school_description', value: 'Cổng thông tin điện tử Trường THCS Nguyễn Trãi' },
        { id: crypto.randomUUID(), key: 'school_opening_hours', value: '07:00' },
        { id: crypto.randomUUID(), key: 'school_closing_hours', value: '17:00' },
      ])
    }

    return { success: true, message: 'Dữ liệu mặc định đã được tạo' }
  } catch (error) {
    console.error('Seed error:', error)
    return { success: false, message: 'Lỗi khi tạo dữ liệu mặc định' }
  }
}
