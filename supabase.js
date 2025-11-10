// supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ✅ ตรวจสอบว่า .env ถูกต้อง
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

// ✅ สร้าง Supabase client ที่ใช้งานได้จริง
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ ต้อง export ตัวนี้ออกไป
module.exports = supabase;
