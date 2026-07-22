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
    // Seed default menu items - add missing ones
    const existingMenus = await db.select().from(menuItems)
    const existingLinks = existingMenus.map(m => m.link)

    const defaultMenus = [
      { label: 'Trang chủ', link: '/', orderIndex: 1 },
      { label: 'Bài viết', link: '/bai-viet', orderIndex: 2 },
      { label: 'Bài giảng', link: '/bai-giang', orderIndex: 3 },
      { label: 'Giáo án', link: '/giao-an', orderIndex: 4 },
      { label: 'Đề thi', link: '/de-thi', orderIndex: 5 },
      { label: 'Tư liệu', link: '/tu-lieu', orderIndex: 6 },
      { label: 'Sáng kiến KN', link: '/sang-kien', orderIndex: 7 },
      { label: 'Toán học vui', link: '/toan-hoc-vui', orderIndex: 8 },
      { label: 'Tin giáo dục', link: '/tin-giao-duc', orderIndex: 9 },
      { label: 'Khóa học', link: '/courses', orderIndex: 10 },
      { label: 'Kiểm tra', link: '/quizzes', orderIndex: 11 },
      { label: 'Liên hệ', link: '/contact', orderIndex: 12 },
    ]

    const menusToAdd = defaultMenus.filter(m => !existingLinks.includes(m.link))
    if (menusToAdd.length > 0) {
      await db.insert(menuItems).values(
        menusToAdd.map(m => ({
          id: crypto.randomUUID(),
          label: m.label,
          link: m.link,
          orderIndex: m.orderIndex,
          isVisible: true,
        }))
      )
    }

    // Seed default settings - add missing ones
    const existingSettings = await db.select().from(settings)
    const existingKeys = existingSettings.map(s => s.key)

    const defaultSettings = [
      { key: 'schoolName', value: 'Trường THCS Nguyễn Trãi' },
      { key: 'schoolAddress', value: 'Quận Gò Vấp, TP. HCM' },
      { key: 'schoolPhone', value: '(028) 3842-5904' },
      { key: 'schoolEmail', value: 'info@truongnguyen.edu.vn' },
      { key: 'schoolWebsite', value: 'https://thcsnguyentraigovap.hcm.edu.vn' },
      { key: 'schoolManager', value: 'ThS. Trần Văn A' },
      { key: 'workingHours', value: 'Thứ 2 - Thứ 6: 7:00 - 17:00' },
      { key: 'primaryColor', value: '#1e3a5f' },
    ]

    const settingsToAdd = defaultSettings.filter(s => !existingKeys.includes(s.key))
    if (settingsToAdd.length > 0) {
      await db.insert(settings).values(
        settingsToAdd.map(s => ({
          id: crypto.randomUUID(),
          key: s.key,
          value: s.value,
        }))
      )
    }

    return { success: true, message: `Đã thêm ${menusToAdd.length} menu items và ${settingsToAdd.length} settings` }
  } catch (error) {
    console.error('Seed error:', error)
    return { success: false, message: 'Lỗi khi tạo dữ liệu mặc định' }
  }
}
