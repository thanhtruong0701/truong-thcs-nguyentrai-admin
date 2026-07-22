const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user' ORDER BY ordinal_position");
  console.log('user columns:', res.rows.map(r => r.column_name).join(', '));

  const adminId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('123', 10);
  const adminEmail = 'admin@truongnguyen.edu.vn';

  try {
    await pool.query(
      'INSERT INTO "user" (id, email, emailverified, name, role, createdat, updatedat) VALUES ($1, $2, true, $3, $4, NOW(), NOW()) ON CONFLICT (email) DO NOTHING',
      [adminId, adminEmail, 'Quản trị viên', 'admin']
    );
    await pool.query(
      'INSERT INTO account (id, accountid, providerid, userid, password, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [crypto.randomUUID(), adminEmail, 'credential', adminId, hashedPassword]
    );
    console.log('Admin user created:');
    console.log('  Email: admin@truongnguyen.edu.vn');
    console.log('  Password: 123');
  } catch (e) {
    console.log('Admin error:', e.message);
  }

  await pool.end();
}

seedAdmin();
