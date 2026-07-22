const { Pool } = require('pg')

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const menuData = [
    { label: 'Trang chủ', link: '/', orderIndex: 1, isVisible: true },
    { label: 'Giới thiệu', link: '/about', orderIndex: 2, isVisible: true },
    { label: 'Pháp chế', link: '/phap-che', orderIndex: 3, isVisible: true },
    { label: 'Tin tức - Sự kiện', link: '/#announcements', orderIndex: 4, isVisible: true },
    { label: 'Văn bản', link: '/van-ban', orderIndex: 5, isVisible: true },
    { label: 'Tin Video', link: '/video', orderIndex: 6, isVisible: true },
    { label: 'Hoạt động chuyên môn', link: '/chuyen-mon', orderIndex: 7, isVisible: true },
    { label: 'Hoạt động đoàn thể', link: '/doan-the', orderIndex: 8, isVisible: true },
    { label: 'Thời khóa biểu', link: '/tkb', orderIndex: 9, isVisible: true },
    { label: 'Tài nguyên', link: '/tai-nguyen', orderIndex: 10, isVisible: true },
    { label: 'Bài kiểm tra', link: '/quizzes', orderIndex: 11, isVisible: true },
    { label: 'Liên hệ', link: '/contact', orderIndex: 12, isVisible: true },
  ]

  // Clear existing menu items
  await pool.query('DELETE FROM menu_items')
  console.log('Cleared existing menu items')

  // Insert new ones
  for (const item of menuData) {
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO menu_items (id, label, link, order_index, is_visible, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [id, item.label, item.link, item.orderIndex, item.isVisible]
    )
    console.log(`Created: ${item.label}`)
  }

  console.log(`\nSeeded ${menuData.length} menu items successfully!`)
  await pool.end()
}

seed().catch(console.error)
