// loginController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

async function handleLogin(username, password) {
  const { data, error } = await supabase
    .from('system_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) return { success: false, message: 'User not found' };

  const valid = await bcrypt.compare(password, data.password);
  if (!valid) return { success: false, message: 'Invalid password' };

  return {
    success: true,
    user: {
      username: data.username,
      role: data.role,
      hospital_id: data.hospital_id,
    },
  };
}

module.exports = { handleLogin };
