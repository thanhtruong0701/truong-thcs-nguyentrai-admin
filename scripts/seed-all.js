const { Pool } = require('pg')

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  // Get admin user ID for foreign keys
  const adminRes = await pool.query("SELECT id FROM \"user\" WHERE role = 'admin' LIMIT 1")
  const adminId = adminRes.rows[0]?.id

  if (!adminId) {
    console.log('No admin user found. Please create an admin user first.')
    await pool.end()
    return
  }

  console.log(`Using admin ID: ${adminId}`)

  // --- Seed Announcements ---
  const announcements = [
    {
      title: 'Khai giảng năm học 2024-2025',
      content: 'Trường THCS Nguyễn Trãi trân trọng thông báo lễ khai giảng năm học 2024-2025 sẽ được tổ chức vào ngày 5 tháng 9 năm 2024 tại khuôn viên trường.\n\nThời gian: 7h30 phút\nĐịa điểm: Sân trường THCS Nguyễn Trãi\n\nTham dự: Tất cả giáo viên, học sinh và phụ huynh.\n\nMọi người vui lòng có mặt đúng giờ.',
      isPinned: true,
      pinOrder: 1,
    },
    {
      title: 'Thông báo lịch nghỉ Tết Nguyên Đán 2025',
      content: 'Theo quyết định của Sở Giáo dục và Đào tạo TP. Hồ Chí Minh, lịch nghỉ Tết Nguyên Đán 2025 như sau:\n\n- Thời gian nghỉ: Từ ngày 25 tháng 01 đến hết ngày 05 tháng 02 năm 2025\n- Ngày đi học lại: Thứ Hai, ngày 06 tháng 02 năm 2025\n\nChúc quý phụ huynh và các em học sinh có một kỳ nghỉ Tết vui vẻ, an toàn!',
      isPinned: true,
      pinOrder: 2,
    },
    {
      title: 'Cuộc thi sáng tạo robot dành cho học sinh',
      content: 'Trường THCS Nguyễn Trãi tổ chức cuộc thi sáng tạo robot dành cho học sinh lớp 6, 7, 8.\n\nThời gian đăng ký: Từ ngày 10/01 đến ngày 25/01/2025\nThời gian thi: Ngày 01/02/2025\nGiải thưởng: Giải nhất 5.000.000đ, giải nhì 3.000.000đ, giải ba 1.000.000đ\n\nĐăng ký tại phòng Tin học hoặc liên hệ giáo viên phụ trách.',
      isPinned: false,
    },
    {
      title: 'Họp phụ huynh học kỳ I',
      content: 'Trường THCS Nguyễn Trãi trân trọng mời quý phụ huynh đến dự buổi họp phụ huynh học kỳ I năm học 2024-2025.\n\nThời gian: 8h00 thứ Bảy, ngày 18/01/2025\nĐịa điểm: Các lớp học\n\nNội dung:\n- Tình hình học tập và rèn luyện của học sinh\n- Kế hoạch giáo dục học kỳ II\n- Phối hợp nhà trường - gia đình',
      isPinned: false,
    },
    {
      title: 'Hoạt động ngoại khóa thăm quan bảo tàng',
      content: 'Hoạt động ngoại khóa thăm quan Bảo tàng Lịch sử Việt Nam dành cho học sinh lớp 7.\n\nThời gian: 7h00 - 12h00 thứ Sáu, ngày 24/01/2025\nĐiểm tập trung: Sân trường trước giờ học\nHọc phí: 50.000đ/học sinh (bao gồm xe đưa đón và vé vào cửa)\n\nĐăng ký với giáo viên chủ nhiệm trước ngày 20/01/2025.',
      isPinned: false,
    },
  ]

  // Clear existing announcements
  await pool.query('DELETE FROM announcements')
  console.log('Cleared existing announcements')

  for (const ann of announcements) {
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO announcements (id, title, content, is_pinned, pin_order, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [id, ann.title, ann.content, ann.isPinned, ann.pinOrder || 0, adminId]
    )
    console.log(`Created announcement: ${ann.title}`)
  }

  // --- Seed Courses ---
  const courses = [
    {
      title: 'Toán học lớp 6',
      description: 'Khóa học Toán học dành cho học sinh lớp 6. Bao gồm các nội dung: Số học, Đại số, Hình học.',
      gradeLevel: 6,
      isPublished: true,
    },
    {
      title: 'Ngữ văn lớp 7',
      description: 'Khóa học Ngữ văn dành cho học sinh lớp 7. Tập trung vào kỹ năng đọc hiểu và viết văn.',
      gradeLevel: 7,
      isPublished: true,
    },
    {
      title: 'Tiếng Anh lớp 6',
      description: 'Khóa học Tiếng Anh dành cho học sinh lớp 6. Phát triển 4 kỹ năng: Nghe, Nói, Đọc, Viết.',
      gradeLevel: 6,
      isPublished: true,
    },
    {
      title: 'Khoa học tự nhiên lớp 8',
      description: 'Khóa học KHTN dành cho học sinh lớp 8. Bao gồm Vật lý, Hóa học, Sinh học.',
      gradeLevel: 8,
      isPublished: false,
    },
  ]

  // Clear existing courses
  await pool.query('DELETE FROM courses')
  console.log('Cleared existing courses')

  for (const course of courses) {
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO courses (id, title, description, grade_level, teacher_id, is_published, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [id, course.title, course.description, course.gradeLevel, adminId, course.isPublished]
    )
    console.log(`Created course: ${course.title}`)
  }

  // --- Seed Lessons for first course ---
  const coursesRes = await pool.query("SELECT id FROM courses WHERE title = 'Toán học lớp 6' LIMIT 1")
  const mathCourseId = coursesRes.rows[0]?.id

  if (mathCourseId) {
    const lessons = [
      { title: 'Chương 1: Số tự nhiên', content: ' Ôn tập và bổ sung kiến thức về số tự nhiên, phép tính cơ bản.', orderIndex: 1 },
      { title: 'Chương 2: Phân số', content: 'Phân số, phép tính với phân số, quy đồng mẫu số.', orderIndex: 2 },
      { title: 'Chương 3: Số thập phân', content: 'Số thập phân, phép tính với số thập phân.', orderIndex: 3 },
      { title: 'Chương 4: Đại cương về hàm số', content: 'Khái niệm hàm số, đồ thị hàm số bậc nhất.', orderIndex: 4 },
    ]

    await pool.query(`DELETE FROM lessons WHERE course_id = '${mathCourseId}'`)
    console.log('Cleared existing lessons')

    for (const lesson of lessons) {
      const id = crypto.randomUUID()
      await pool.query(
        'INSERT INTO lessons (id, course_id, title, content, order_index, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [id, mathCourseId, lesson.title, lesson.content, lesson.orderIndex]
      )
      console.log(`Created lesson: ${lesson.title}`)
    }
  }

  // --- Seed a Quiz ---
  const quizzesRes = await pool.query('SELECT COUNT(*) FROM quizzes')
  if (parseInt(quizzesRes.rows[0].count) === 0) {
    const quizId = crypto.randomUUID()
    await pool.query(
      'INSERT INTO quizzes (id, title, description, time_limit, max_attempts, is_published, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [quizId, 'Kiểm tra Toán lớp 6 - Chương 1', 'Bài kiểm tra nhanh về số tự nhiên và phép tính cơ bản', 15, 3, true, adminId]
    )
    console.log('Created quiz: Kiểm tra Toán lớp 6')

    const questions = [
      { text: 'Số lớn nhất trong các số: 15, 23, 8, 31?', type: 'multiple_choice', options: ['15', '23', '8', '31'], answer: '3', points: 2 },
      { text: 'Kết quả của 25 + 37 = ?', type: 'multiple_choice', options: ['52', '62', '72', '82'], answer: '1', points: 2 },
      { text: '3 × 4 = ?', type: 'multiple_choice', options: ['7', '12', '14', '15'], answer: '1', points: 1 },
      { text: 'Số 100 có mấy chữ số?', type: 'multiple_choice', options: ['1', '2', '3', '4'], answer: '2', points: 1 },
      { text: '50 - 23 = ?', type: 'multiple_choice', options: ['23', '27', '33', '37'], answer: '1', points: 2 },
    ]

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await pool.query(
        'INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, correct_answer, points, order_index, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
        [crypto.randomUUID(), quizId, q.text, q.type, JSON.stringify(q.options), q.answer, q.points, i + 1]
      )
    }
    console.log(`Created ${questions.length} quiz questions`)
  }

  console.log('\n=== Seed completed! ===')
  await pool.end()
}

seed().catch(console.error)
