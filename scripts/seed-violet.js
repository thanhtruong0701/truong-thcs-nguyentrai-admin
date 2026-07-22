const { Pool } = require('pg')

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adminRes = await pool.query("SELECT id FROM \"user\" WHERE role = 'admin' LIMIT 1")
  const adminId = adminRes.rows[0]?.id

  if (!adminId) {
    console.log('No admin user found')
    await pool.end()
    return
  }

  console.log(`Using admin ID: ${adminId}`)

  // --- Update settings ---
  const settingsData = [
    { key: 'schoolName', value: 'Trường THCS Nguyễn Trãi' },
    { key: 'schoolAddress', value: '250 Nguyễn Trọng Cát, khu phố Hiệp Thạnh, phường Tân Ninh, tỉnh Tây Ninh' },
    { key: 'schoolPhone', value: '02763621963' },
    { key: 'schoolEmail', value: 'nguyentraitx@gmail.com' },
    { key: 'schoolWebsite', value: 'thcs-nguyentrai-tayninh.violet.vn' },
    { key: 'schoolManager', value: 'Nguyễn Văn Tuyến' },
  ]

  for (const s of settingsData) {
    await pool.query(
      `INSERT INTO settings (id, "key", value, updated_at) VALUES ($1, $2, $3, NOW())
       ON CONFLICT ("key") DO UPDATE SET value = $3, updated_at = NOW()`,
      [crypto.randomUUID(), s.key, s.value]
    )
  }
  console.log('Updated school settings')

  // --- Clear and re-seed menu items ---
  await pool.query('DELETE FROM menu_items')
  const menuData = [
    { label: 'Trang chủ', link: '/', orderIndex: 1 },
    { label: 'Bài viết', link: '/bai-viet', orderIndex: 2 },
    { label: 'Bài giảng', link: '/bai-giang', orderIndex: 3 },
    { label: 'Giáo án', link: '/giao-an', orderIndex: 4 },
    { label: 'Đề thi', link: '/de-thi', orderIndex: 5 },
    { label: 'Tư liệu', link: '/tu-lieu', orderIndex: 6 },
    { label: 'Sáng kiến kinh nghiệm', link: '/sang-kien', orderIndex: 7 },
    { label: 'Tin giáo dục', link: '/tin-giao-duc', orderIndex: 8 },
    { label: 'Tin tức', link: '/tin-tuc', orderIndex: 9 },
    { label: 'Liên hệ', link: '/lien-he', orderIndex: 10 },
  ]

  for (const item of menuData) {
    await pool.query(
      'INSERT INTO menu_items (id, label, link, order_index, is_visible, created_at, updated_at) VALUES ($1, $2, $3, $4, true, NOW(), NOW())',
      [crypto.randomUUID(), item.label, item.link, item.orderIndex]
    )
  }
  console.log(`Seeded ${menuData.length} menu items`)

  // --- Seed announcements (from website data) ---
  await pool.query('DELETE FROM announcements')
  const announcements = [
    {
      title: 'TUYÊN TRUYỀN PHÒNG CHỐNG TÁC HẠI CỦA MA TÚY',
      content: 'Trường THCS Nguyễn Trãi kết hợp với công an phường Tân Ninh tổ chức tuyên truyền phòng chống tác hại của ma túy cho toàn thể giáo viên và học sinh trong trường.',
      isPinned: true,
    },
    {
      title: 'NGÀY HỘI "THIẾU NHI VUI KHỎE – TIẾN BƯỚC LÊN ĐOÀN"',
      content: 'Chương trình ngày hội thiếu nhi vui khỏe, chào mừng ngày thành lập Đoàn TNCS Hồ Chí Minh.',
      isPinned: false,
    },
    {
      title: 'CHÀO MỪNG NGÀY 8/3',
      content: 'Trường THCS Nguyễn Trãi tổ chức lễ chào mừng ngày Quốc tế Phụ nữ 8/3 với nhiều hoạt động ý nghĩa.',
      isPinned: false,
    },
    {
      title: 'Chương trình giao lưu văn nghệ (21/10/2025)',
      content: 'Chương trình giao lưu văn nghệ cùng trung tâm dạy nghề phát triển việc làm và hỗ trợ người tàn tật tỉnh Ninh Bình.',
      isPinned: false,
    },
    {
      title: 'KẾT QUẢ THI TỐT NGHIỆP THPT NĂM 2013',
      content: 'Thông báo kết quả thi tốt nghiệp THPT năm 2013 của các em học sinh trường THCS Nguyễn Trãi.',
      isPinned: false,
    },
  ]

  for (const ann of announcements) {
    await pool.query(
      'INSERT INTO announcements (id, title, content, is_pinned, pin_order, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [crypto.randomUUID(), ann.title, ann.content, ann.isPinned, ann.isPinned ? 1 : 0, adminId]
    )
  }
  console.log(`Seeded ${announcements.length} announcements`)

  // --- Seed pages (content for categories) ---
  await pool.query('DELETE FROM pages')

  // Get menu item IDs
  const menuRes = await pool.query('SELECT id, link FROM menu_items')
  const menuMap = {}
  for (const m of menuRes.rows) {
    menuMap[m.link] = m.id
  }

  const pagesData = [
    {
      menuItemId: menuMap['/bai-viet'],
      title: 'Bài viết',
      content: 'Tổng hợp các bài viết về hoạt động của trường THCS Nguyễn Trãi, bao gồm tuyên truyền phòng chống ma túy, ngày hội thiếu nhi, chào mừng các ngày lễ lớn.',
    },
    {
      menuItemId: menuMap['/bai-giang'],
      title: 'Bài giảng',
      content: 'Tổng hợp bài giảng điện tử các môn học: Đại số, Thông tin và tin học, Ngữ văn, Khoa học tự nhiên... dành cho học sinh lớp 6, 7, 8, 9.',
    },
    {
      menuItemId: menuMap['/giao-an'],
      title: 'Giáo án',
      content: 'Bộ giáo án chuẩn theo chương trình giáo dục phổ thông mới. Bao gồm giáo án các môn: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa.',
    },
    {
      menuItemId: menuMap['/de-thi'],
      title: 'Đề thi',
      content: 'Bộ đề thi học kỳ, thi giữa kỳ, đề thi chọn học sinh giỏi các môn. Cấu trúc đề thi theo chuẩn Bộ Giáo dục.',
    },
    {
      menuItemId: menuMap['/tu-lieu'],
      title: 'Tư liệu',
      content: 'Kho tư liệu dạy học phong phú: hình ảnh, video, tài liệu tham khảo cho giáo viên và học sinh.',
    },
    {
      menuItemId: menuMap['/sang-kien'],
      title: 'Sáng kiến kinh nghiệm',
      content: 'Tuyển tập sáng kiến kinh nghiệm của giáo viên trường THCS Nguyễn Trãi về đổi mới phương pháp giảng dạy.',
    },
    {
      menuItemId: menuMap['/tin-giao-duc'],
      title: 'Tin giáo dục',
      content: 'Tin tức giáo dục mới nhất: lợi ích phương pháp giảng dạy tích cực, các website hay về giáo dục, tin tức ngành giáo dục.',
    },
    {
      menuItemId: menuMap['/lien-he'],
      title: 'Liên hệ',
      content: 'Cơ quan chủ quản: UBND Phường Tân Ninh\nĐịa chỉ: 250 Nguyễn Trọng Cát, khu phố Hiệp Thạnh, phường Tân Ninh, tỉnh Tây Ninh\nĐiện thoại: 02763621963\nEmail: nguyentraitx@gmail.com\nQuản lý nội dung: Nguyễn Văn Tuyến',
    },
  ]

  for (const page of pagesData) {
    if (page.menuItemId) {
      await pool.query(
        'INSERT INTO pages (id, menu_item_id, title, content, is_published, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())',
        [crypto.randomUUID(), page.menuItemId, page.title, page.content, adminId]
      )
    }
  }
  console.log(`Seeded ${pagesData.length} pages`)

  console.log('\n=== Seed completed! ===')
  await pool.end()
}

seed().catch(console.error)
