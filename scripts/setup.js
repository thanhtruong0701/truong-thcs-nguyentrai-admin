#!/usr/bin/env node

/**
 * Script setup tổng hợp cho admin project
 * Chạy: node scripts/setup.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createBucket() {
  console.log('\n1. Kiểm tra Supabase bucket "materials"...');
  
  try {
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    });
    const buckets = await listRes.json();
    
    const existing = buckets.find(b => b.name === 'materials');
    if (existing) {
      console.log('   ✓ Bucket "materials" đã tồn tại');
      return true;
    }

    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'materials',
        name: 'materials',
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/x-rar-compressed',
          'application/vnd.rar',
          'application/zip',
          'application/x-zip-compressed',
          'image/jpeg',
          'image/png',
          'image/gif',
        ],
      }),
    });

    if (createRes.ok) {
      console.log('   ✓ Bucket "materials" đã được tạo');
      return true;
    } else {
      const err = await createRes.json();
      console.log('   ✗ Lỗi tạo bucket:', err.message || err);
      return false;
    }
  } catch (e) {
    console.log('   ✗ Lỗi kết nối Supabase:', e.message);
    return false;
  }
}

async function seedAdmin() {
  console.log('\n2. Tạo admin user...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adminEmail = 'admin@truongnguyen.edu.vn';
  
  try {
    // Check if admin exists
    const checkRes = await pool.query(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [adminEmail]
    );
    
    if (checkRes.rows.length > 0) {
      console.log('   ✓ Admin user đã tồn tại');
      await pool.end();
      return true;
    }

    const adminId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash('123', 10);

    await pool.query(
      `INSERT INTO "user" (id, email, emailverified, name, role, createdat, updatedat) 
       VALUES ($1, $2, true, $3, $4, NOW(), NOW())`,
      [adminId, adminEmail, 'Quản trị viên', 'admin']
    );
    
    await pool.query(
      `INSERT INTO account (id, accountid, providerid, userid, password, createdat, updatedat) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [crypto.randomUUID(), adminEmail, 'credential', adminId, hashedPassword]
    );
    
    console.log('   ✓ Admin user đã được tạo');
    console.log('   Email: admin@truongnguyen.edu.vn');
    console.log('   Password: 123');
    await pool.end();
    return true;
  } catch (e) {
    console.log('   ✗ Lỗi:', e.message);
    await pool.end();
    return false;
  }
}

async function checkSettingsTable() {
  console.log('\n3. Kiểm tra bảng settings...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const checkRes = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings')"
    );
    
    const exists = checkRes.rows[0].exists;
    if (exists) {
      // Count rows
      const countRes = await pool.query('SELECT COUNT(*) FROM settings');
      console.log(`   ✓ Bảng settings tồn tại (${countRes.rows[0].count} records)`);
    } else {
      console.log('   ⚠ Bảng settings chưa tồn tại');
      console.log('   → Chạy lệnh: pnpm db:push');
    }
    
    await pool.end();
    return exists;
  } catch (e) {
    console.log('   ✗ Lỗi:', e.message);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('=== Setup Admin Project ===');
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'N/A');
  
  await createBucket();
  await seedAdmin();
  await checkSettingsTable();
  
  console.log('\n=== Hoàn tất! ===');
  console.log('\nCác bước tiếp theo:');
  console.log('1. Chạy: pnpm db:push (để tạo/cập nhật schema)');
  console.log('2. Chạy: pnpm dev (khởi động server)');
  console.log('3. Truy cập: http://localhost:3001');
  console.log('4. Đăng nhập:');
  console.log('   Email: admin@truongnguyen.edu.vn');
  console.log('   Password: 123');
}

main().catch(console.error);
