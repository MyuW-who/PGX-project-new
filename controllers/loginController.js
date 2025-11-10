// controllers/loginController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

async function handleLogin(event, { username, password }) {
  try {
    const u = (username || '').trim();
    const p = (password || '').trim().normalize('NFKC');

    const { data, error } = await supabase
      .from('system_users')
      .select('user_id, username, password_hash, role, hospital_id, created_at')
      .eq('username', u)
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้' };
    }

    const ok = await bcrypt.compare(p, String(data.password_hash || '').trim());
    if (!ok) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    // Update last login time
    await supabase
      .from('system_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', data.user_id);

    // Return complete user data for session storage (excluding password_hash)
    const userData = {
      user_id: data.user_id,
      username: data.username,
      role: data.role,
      hospital_id: data.hospital_id,
      created_at: data.created_at
    };

    return { 
      success: true, 
      role: data.role,
      data: userData
    };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดระหว่างตรวจสอบ' };
  }
}

module.exports = { handleLogin };