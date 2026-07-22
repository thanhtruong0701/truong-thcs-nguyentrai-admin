const { Pool } = require('pg')

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adminRes = await pool.query("SELECT id FROM \"user\" WHERE role = 'admin' LIMIT 1")
  const adminId = adminRes.rows[0]?.id
  if (!adminId) { console.log('No admin'); await pool.end(); return }

  // --- Menu items ---
  await pool.query('DELETE FROM menu_items')
  const menus = [
    { label: 'Trang chủ', link: '/', orderIndex: 1 },
    { label: 'Bài viết', link: '/bai-viet', orderIndex: 2 },
    { label: 'Bài giảng', link: '/bai-giang', orderIndex: 3 },
    { label: 'Giáo án', link: '/giao-an', orderIndex: 4 },
    { label: 'Đề thi', link: '/de-thi', orderIndex: 5 },
    { label: 'Tư liệu', link: '/tu-lieu', orderIndex: 6 },
    { label: 'Sáng kiến KN', link: '/sang-kien', orderIndex: 7 },
    { label: 'Toán học vui', link: '/toan-hoc-vui', orderIndex: 8 },
    { label: 'Tin giáo dục', link: '/tin-giao-duc', orderIndex: 9 },
    { label: 'Tin tức', link: '/tin-tuc', orderIndex: 10 },
    { label: 'Liên hệ', link: '/lien-he', orderIndex: 11 },
  ]
  const menuMap = {}
  for (const m of menus) {
    const id = crypto.randomUUID()
    menuMap[m.link] = id
    await pool.query('INSERT INTO menu_items (id, label, link, order_index, is_visible, created_at, updated_at) VALUES ($1,$2,$3,$4,true,NOW(),NOW())', [id, m.label, m.link, m.orderIndex])
  }
  console.log(`Seeded ${menus.length} menu items`)

  // --- Announcements (all posts from website) ---
  await pool.query('DELETE FROM announcements')
  const announcements = [
    { title: 'TUYÊN TRUYỀN PHÒNG CHỐNG TÁC HẠI CỦA MA TÚY', content: 'Trường THCS Nguyễn Trãi kết hợp với công an phường Tân Ninh tổ chức tuyên truyền phòng chống tác hại của ma túy cho toàn thể giáo viên và học sinh trong trường.', pinned: true },
    { title: 'NGÀY HỘI "THIẾU NHI VUI KHỎE – TIẾN BƯỚC LÊN ĐOÀN"', content: 'Căn cứ vào kế hoạch số 18/KH/TĐTN-CTĐTTN của BCH Đoàn Tỉnh Tây Ninh ngày 24/2/2026 về việc tổ chức ngày hội "Thiếu nhi vui khỏe – Tiến bước lên Đoàn". Liên đội trường THCS Nguyễn Trãi xây dựng kế hoạch tổ chức ngày hội chào mừng bầu cử đại biểu Quốc hội khóa XVI.', pinned: false },
    { title: 'CHÀO MỪNG NGÀY 8/3', content: 'Tập thể GV nam trường Nguyễn Trãi tổ chức kỉ niệm ngày Quốc tế phụ nữ.', pinned: false },
    { title: 'Đón tết an khang - Mừng xuân Bính Ngọ năm 2026', content: 'Nhằm tạo không khí vui tươi, phấn khở mừng kỉ niệm 96 năm ngày thành lập Đảng Cộng sản Việt Nam và đón xuân Bính Ngọ năm 2026, Liên đội trường THCS Nguyễn Trãi tổ chức hội thi "Mai đào khoe sắc - Đón tết an khang".', pinned: false },
    { title: 'LỄ SƠ KẾT HỌC KỲ 1 NĂM HỌC 2025-2026', content: 'Nhà trường thực hiện sơ kết học kỳ 1 và triển khai nhiệm vụ thực hiện trong học kỳ 2.', pinned: false },
    { title: 'THỰC HIỆN QUY CHẾ CÔNG KHAI TRONG NHÀ TRƯỜNG THEO THÔNG TƯ 09/2024/TT-BGDĐT', content: 'Thực hiện quy chế công khai trong nhà trường theo thông tư 09/2024/TT-BGDĐT năm học 2025-2026.', pinned: false },
    { title: 'LỄ KẾT NẠP ĐẢNG VIÊN MỚI', content: 'Chi bộ trường THCS Nguyễn Trãi kết hợp với Đảng Uỷ phường Tân Ninh tiến hành làm lễ kết nạp và trao quyết định cho đảng viên Nguyễn Thị Ngọc Giàu.', pinned: false },
    { title: 'THAM QUAN DU LỊCH - TRẢI NGHIỆM TUYẾN METRO & KDL SUỐI TIÊN', content: 'Nhà trường phối hợp với Liên đội tổ chức cho học sinh tham quan, trải nghiệm tuyến Metro, và KDL Suối Tiên.', pinned: false },
    { title: 'KẾT NỐI YÊU THƯƠNG CÙNG "MÁI ẤM GIA ĐÌNH VIỆT"', content: 'Căn cứ vào công văn Số:321.CV/HSG/2025 và công văn Số:2597/SGDĐT-GDPT. Đoàn trường thực hiện rà sót và chọn học sinh tham gia chương trình "Mái ấm gia đình Việt".', pinned: false },
    { title: 'BẢO VỆ RĂNG MIỆNG HỌC ĐƯỜNG', content: 'Trường THCS Nguyễn Trãi kết hợp với Nha Khoa Ken tuyên truyền về bảo vệ răng miệng trong học đường.', pinned: false },
    { title: 'LỄ CÔNG BỐ QUYẾT ĐỊNH VỀ CÔNG TÁC QUẢN LÝ VIÊN CHỨC', content: 'Lễ công bố quyết định về công tác quản lý viên chức năm học 2025-2026.', pinned: false },
    { title: 'THÔNG BÁO CÁC KHOẢN THU NĂM HỌC 2025-2026', content: 'Thông báo các khoản thu năm học 2025-2026 theo quy định của Sở Giáo dục tỉnh Tây Ninh.', pinned: false },
    { title: 'HỢP LỰC ĐỔI MỚI TƯ DUY GIÁO DỤC', content: '"Hợp lực đổi mới tư duy giáo dục" - Giờ hoạt động ngoài trời của trẻ. Các chuyên gia, nhà quản lý, nhà giáo bày tỏ tâm huyết, những giải pháp cụ thể để những ý tưởng đổi mới giáo dục được phát huy.', pinned: false },
    { title: 'THỰC HIỆN MÔN VẬT LÝ 6', content: 'Môn: Vật lý – Lớp 6. GV giao bài: Nguyễn Thị Lệ Chi. Nội dung: Thực hiện ôn tập và làm các bài tập về ròng rọc cố định và ròng rọc động.', pinned: false },
  ]
  for (const ann of announcements) {
    await pool.query('INSERT INTO announcements (id, title, content, is_pinned, pin_order, created_by, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())', [crypto.randomUUID(), ann.title, ann.content, ann.pinned, ann.pinned ? 1 : 0, adminId])
  }
  console.log(`Seeded ${announcements.length} announcements`)

  // --- Pages (content for each category) ---
  await pool.query('DELETE FROM pages')
  const pagesData = [
    { link: '/bai-viet', title: 'Bài viết', content: 'Tổng hợp các bài viết về hoạt động của trường THCS Nguyễn Trãi Tây Ninh.\n\nCác bài viết tiêu biểu:\n- Tuyên truyền phòng chống tác hại của ma túy\n- Ngày hội "Thiếu nhi vui khỏe – Tiến bước lên Đoàn"\n- Chào mừng ngày Quốc tế Phụ nữ 8/3\n- Đón tết an khang - Mừng xuân Bính Ngọ năm 2026\n- Lễ sơ kết học kỳ 1 năm học 2025-2026\n- Lễ kết nạp đảng viên mới\n- Tham quan du lịch - Trải nghiệm tuyến Metro & KDL Suối Tiên\n- Kết nối yêu thương cùng "Mái ấm gia đình Việt"\n- Bảo vệ răng miệng học đường\n- Lễ công bố quyết định quản lý viên chức' },
    { link: '/bai-giang', title: 'Bài giảng', content: 'Kho bài giảng điện tử phong phú với 267 bài giảng covers các môn:\n\n• Toán học (51 bài): Đại số 7, Hình học 7, Số học 6...\n• Vật lý (10 bài): Công suất điện, Định luật Ohm...\n• Hóa học (13 bài): Đơn chất và hợp chất, Axetilen...\n• Sinh học (31 bài): Thường biến, Bộ xương, Biến dạng của lá...\n• Lịch sử (7 bài): Phong trào kháng chiến chống Pháp...\n• Địa lý (29 bài): Phân bố công nghiệp, Kinh tế...\n• Ngữ văn (18 bài): Ấn Độ thời phong kiến, Thầy bói xem voi...\n• GDCD (2 bài): Quyền và nghĩa vụ công dân...\n• Mỹ thuật (12 bài): Phong cảnh thiên nhiên...\n• Ngoại ngữ (9 bài): Tiếng Anh 8, 9...\n• Tin học (3 bài): Thông tin và tin học...\n• Công nghệ (2 bài): Sắp xếp đồ đạc hợp lí...' },
    { link: '/giao-an', title: 'Giáo án', content: 'Bộ giáo án chuẩn với 296 bài giáo án:\n\n• Toán học (32 bài): Số học 6, Đại số 7...\n• Vật lý (27 bài): Vật lí 6, Thấu kính...\n• Hóa học (22 bài): Tự học Hóa 8, 9...\n• Sinh học (6 bài): Thụ phấn, Lưỡng cư...\n• Lịch sử (8 bài): Kháng chiến chống Pháp...\n• Địa lý (23 bài): Ô nhiễm môi trường, Vùng Bắc Trung Bộ...\n• Ngữ văn (89 bài): Ếch ngồi đáy giếng, Câu nghi vấn...\n• GDCD (3 bài): Bảo vệ di sản văn hoá...\n• Âm nhạc (7 bài)\n• Thể dục (10 bài): Nội dung tự học thể dục...\n• Công nghệ (4 bài): Ôn tập, Bảo quản chất dinh dưỡng...\n• Tin học (3 bài): Lệnh lặp While...Do...\n• Ngoại ngữ (44 bài): Tiếng Anh 6, 8, 9...' },
    { link: '/de-thi', title: 'Đề thi', content: 'Bộ đề thi đa dạng:\n\n• Cấu trúc đề thi HSG\n• Đại số 8 - Đề thi học kì 1\n• Bộ đề Ngữ văn tuyển 10\n• Bộ đề Toán tuyển 10\n• Đề thi các môn lớp 6, 7, 8, 9\n\nTổng hợp 19 đề thi chất lượng cao.' },
    { link: '/tu-lieu', title: 'Tư liệu', content: 'Kho tư liệu dạy học với 20 tài liệu:\n\n• Tập thể cán bộ giáo viên nhân viên trường THCS Nguyễn Trãi\n• Hội nghị cán bộ công chức viên chức năm học 2020-2021\n• Phát động phong trào nuôi heo đất\n• Địa lí 8 - Bài 29: Đặc điểm các khu vực địa hình\n• Bộ đề thi Toán tuyển 10 năm 2019-2020\n• Bộ đề thi Ngữ văn tuyển 10\n• Sinh 6 - Tiết 43: Rêu cây rêu\n• Vùng Đồng bằng sông Cửu Long\n• Ôn tập Lý 7, Lý 8, Lý 9\n• Mô hình trường THCS Nguyễn Trãi mới\n• Trải nghiệm Bến Tre\n• My Heart Will Go On' },
    { link: '/sang-kien', title: 'Sáng kiến kinh nghiệm', content: 'Tuyển tập 34 sáng kiến kinh nghiệm của giáo viên:\n\n• Giáo dục KNS cho học sinh thông qua môn GDCD\n• Tổ chức trò chơi vào tiết SHCN\n• Tổ chức trò chơi vào tiết SHCN lớp 9\n• Các sáng kiến đổi mới phương pháp giảng dạy\n• Kinh nghiệm tổ chức hoạt động trải nghiệm\n• Sáng kiến áp dụng CNTT vào giảng dạy' },
    { link: '/toan-hoc-vui', title: 'Toán học vui', content: 'Chuyên mục Toán học vui với 8 bài viết:\n\n• Ngày thứ mấy - Bài toán về lịch\n• Bài toán mừng tuổi\n• Làm sao biết được?\n\nCác bài toán vui nhộn, giúp học sinh yêu thích môn Toán.' },
    { link: '/tin-giao-duc', title: 'Tin giáo dục', content: 'Tin tức giáo dục mới nhất:\n\n• Lợi ích của phương pháp giảng dạy tích cực\n• Những website hay về giáo dục\n• Phương pháp giáo dục chủ động\n• Đổi mới giáo dục phổ thông\n\nTổng hợp 10 tin tức giáo dục.' },
    { link: '/lien-he', title: 'Liên hệ', content: 'THÔNG TIN LIÊN HỆ\n\nTrường THCS Nguyễn Trãi\n\nCơ quan chủ quản: UBND Phường Tân Ninh\nĐịa chỉ: 250 Nguyễn Trọng Cát, khu phố Hiệp Thạnh, phường Tân Ninh, tỉnh Tây Ninh\nĐiện thoại: 02763621963\nEmail: nguyentraitx@gmail.com\nQuản lý nội dung: Nguyễn Văn Tuyến\nWebsite: thcs-nguyentrai-tayninh.violet.vn\n\nThống kê:\n• 251,405 lượt truy cập\n• 384,289 lượt xem\n• 33 thành viên' },
  ]
  for (const page of pagesData) {
    if (menuMap[page.link]) {
      await pool.query('INSERT INTO pages (id, menu_item_id, title, content, is_published, created_by, created_at, updated_at) VALUES ($1,$2,$3,$4,true,$5,NOW(),NOW())', [crypto.randomUUID(), menuMap[page.link], page.title, page.content, adminId])
    }
  }
  console.log(`Seeded ${pagesData.length} pages`)

  // --- Courses (based on subjects from website) ---
  await pool.query('DELETE FROM courses')
  const courses = [
    { title: 'Toán học lớp 6', desc: 'Số học 6: Phân số, Số thập phân, Đại cương về hàm số', grade: 6 },
    { title: 'Toán học lớp 7', desc: 'Đại số 7: Tập hợp số hữu tỉ, Cộng trừ số hữu tỉ. Hình học 7: Định lí Py-ta-go', grade: 7 },
    { title: 'Toán học lớp 8', desc: 'Đại số 8, Hình học 8 theo chương trình GDPT 2018', grade: 8 },
    { title: 'Toán học lớp 9', desc: 'Ôn tập Toán 9, Chuẩn bị thi vào lớp 10', grade: 9 },
    { title: 'Vật lý lớp 6', desc: 'Ròng rọc, Định luật Ohm, Công suất điện', grade: 6 },
    { title: 'Vật lý lớp 9', desc: 'Từ trường, Định luật Ohm nâng cao', grade: 9 },
    { title: 'Hóa học lớp 8', desc: 'Đơn chất và hợp chất, Axetilen', grade: 8 },
    { title: 'Hóa học lớp 9', desc: 'Sự biến đổi chất, Ôn tập Hóa 9', grade: 9 },
    { title: 'Sinh học lớp 6', desc: 'Rêu cây rêu, Bộ xương', grade: 6 },
    { title: 'Sinh học lớp 8', desc: 'Thường biến, Biến dạng của lá', grade: 8 },
    { title: 'Sinh học lớp 9', desc: 'Thụ phân, Đa dạng lớp Lưỡng cư', grade: 9 },
    { title: 'Lịch sử lớp 8', desc: 'Phong trào kháng chiến chống Pháp, Cuộc đấu tranh 1945-1946', grade: 8 },
    { title: 'Địa lý lớp 8', desc: 'Phân bố công nghiệp, Kinh tế', grade: 8 },
    { title: 'Địa lý lớp 9', desc: 'Vùng Bắc Trung Bộ, Ô nhiễm môi trường', grade: 9 },
    { title: 'Ngữ văn lớp 7', desc: 'Ấn Độ thời phong kiến, Thầy bói xem voi', grade: 7 },
    { title: 'Ngữ văn lớp 8', desc: 'Sự suy sụp của nhà Trần', grade: 8 },
    { title: 'Tiếng Anh lớp 6', desc: 'Chương trình GDPT 2018 môn Tiếng Anh', grade: 6 },
    { title: 'Tiếng Anh lớp 8', desc: 'Unit 7, Unit 12 - Getting started', grade: 8 },
    { title: 'Tiếng Anh lớp 9', desc: 'Unit 4 Read, Unit 8 Tourism', grade: 9 },
    { title: 'Tin học lớp 6', desc: 'Thông tin và tin học, Phần mềm tạo ảnh động', grade: 6 },
  ]
  for (const c of courses) {
    await pool.query('INSERT INTO courses (id, title, description, grade_level, teacher_id, is_published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())', [crypto.randomUUID(), c.title, c.desc, c.grade, adminId])
  }
  console.log(`Seeded ${courses.length} courses`)

  console.log('\n=== Full seed completed! ===')
  await pool.end()
}

seed().catch(console.error)
