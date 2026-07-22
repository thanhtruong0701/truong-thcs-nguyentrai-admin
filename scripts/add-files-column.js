const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("ALTER TABLE pages ADD COLUMN IF NOT EXISTS files text")
  .then(r => { console.log('Added files column'); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
