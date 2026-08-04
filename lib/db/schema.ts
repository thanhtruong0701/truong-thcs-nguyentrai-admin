import { pgTable, text, timestamp, boolean, serial, integer } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailverified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
  role: text('role').notNull().default('student'),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountid').notNull(),
  providerId: text('providerid').notNull(),
  userId: text('userid')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accesstoken'),
  refreshToken: text('refreshtoken'),
  idToken: text('idtoken'),
  accessTokenExpiresAt: timestamp('accesstokenexpiresat'),
  refreshTokenExpiresAt: timestamp('refreshtokenexpiresat'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables -----------------------------------------------------------

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  images: text('images'), // JSON array: [url1, url2, ...]
  files: text('files'),   // JSON array: [{url, name, type}]
  isPinned: boolean('is_pinned').notNull().default(false),
  pinOrder: integer('pin_order').default(0),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  gradeLevel: integer('grade_level'),
  teacherId: text('teacher_id').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const materials = pgTable('materials', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull(),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const teacherPermissions = pgTable('teacher_permissions', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull(),
  courseId: text('course_id').notNull(),
  canEdit: boolean('can_edit').notNull().default(true),
  canUpload: boolean('can_upload').notNull().default(true),
  canPublish: boolean('can_publish').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  link: text('link').notNull(),
  icon: text('icon').default('📄'),                // emoji icon
  menuType: text('menu_type').default('page'),    // 'page' | 'category' (danh mục cha, không có link)
  parentId: text('parent_id'),                    // null = root menu, có giá trị = sub-menu
  orderIndex: integer('order_index').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// --- File uploads (standalone downloadable files) ---------------------------

export const fileUploads = pgTable('file_uploads', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  category: text('category').default('general'),
  uploadedBy: text('uploaded_by').notNull(),
  downloadCount: integer('download_count').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  allowDownload: boolean('allow_download').notNull().default(true), // admin tick = cho tải
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// --- Quiz tables ------------------------------------------------------------

export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  courseId: text('course_id'),
  timeLimit: integer('time_limit'),
  maxAttempts: integer('max_attempts').default(1),
  isPublished: boolean('is_published').notNull().default(false),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const quizQuestions = pgTable('quiz_questions', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull().default('multiple_choice'),
  options: text('options').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  points: integer('points').notNull().default(1),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  answers: text('answers').notNull().default('{}'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

// --- Pages (content for menu items) -----------------------------------------

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  menuItemId: text('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  files: text('files'), // JSON array: [{url, name, type}]
  isPublished: boolean('is_published').notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
