// controllers/loginController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

async function handleLogin(event, { username, password }) {
  try {
    const u = (username || '').trim();
    const p = (password || '').trim().normalize('NFKC');

    const { data, error } = await supabase
      .from('system_users')
      .select('username, password_hash, role')
      .eq('username', u)
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้' };
    }

    const ok = await bcrypt.compare(p, String(data.password_hash || '').trim());
    if (!ok) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    // ✅ เพิ่ม role กลับไปใน response
    return { success: true, role: data.role };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดระหว่างตรวจสอบ' };
  }
}

module.exports = { handleLogin };