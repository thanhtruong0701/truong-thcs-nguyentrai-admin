const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Create admin user
  const adminId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('123', 10);

  try {
    await pool.query(
      'INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt") VALUES ($1, $2, true, $3, \'admin\', NOW(), NOW()) ON CONFLICT (email) DO NOTHING',
      [adminId, 'admin', 'Quản trị viên']
    );
    await pool.query(
      'INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, \'credential\', $3, $4, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [crypto.randomUUID(), 'admin', adminId, hashedPassword]
    );
    console.log('Admin user created (admin / 123)');
  } catch (e) {
    console.log('Admin user:', e.message);
  }

  // 2. Create menu items
  try {
    const menuData = [
      ['Trang chủ', '/', 1],
      ['Khóa học', '/courses', 2],
      ['Thông báo', '/#announcements', 3],
      ['Liên hệ', '/contact', 4],
    ];
    for (const [label, link, order] of menuData) {
      await pool.query(
        'INSERT INTO menu_items (id, label, link, order_index, is_visible, created_at, updated_at) VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
        [crypto.randomUUID(), label, link, order]
      );
    }
    console.log('Menu items created');
  } catch (e) {
    console.log('Menu items:', e.message);
  }

  // 3. Create settings
  try {
    const settings = [
      ['school_name', 'Trường THCS Nguyễn Trãi'],
      ['school_address', 'Quận Gò Vấp, TP. HCM'],
      ['school_phone', '(028) 3842-5904'],
      ['school_email', 'info@truongnguyen.edu.vn'],
      ['school_principal', 'ThS. Trần Văn A'],
      ['school_description', 'Cổng thông tin điện tử Trường THCS Nguyễn Trãi'],
      ['school_opening_hours', '07:00'],
      ['school_closing_hours', '17:00'],
    ];
    for (const [key, value] of settings) {
      await pool.query(
        'INSERT INTO settings (id, key, value, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (key) DO NOTHING',
        [crypto.randomUUID(), key, value]
      );
    }
    console.log('Settings created');
  } catch (e) {
    console.log('Settings:', e.message);
  }

  await pool.end();
  console.log('\nSeed completed!');
}

seed();
