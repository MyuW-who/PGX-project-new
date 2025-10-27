const supabase = require('../supabase');

async function fetchAccountDetails(userId) {
  const { data, error } = await supabase
    .from('system_users')
    .select('user_id, username, role, hospital_id, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error('Error fetching account details: ' + error.message);
  }

  return data;
}

async function fetchAllAccounts() {
  const { data, error } = await supabase
    .from('system_users')
    .select('user_id, username, role, hospital_id, created_at, updated_at')
    .order('user_id', { ascending: true });

  if (error) {
    throw new Error('Error fetching accounts: ' + error.message);
  }

  return data;
}

async function createAccount(userData) {
  // First check if username already exists
  const { data: existingUser } = await supabase
    .from('system_users')
    .select('user_id')
    .eq('username', userData.username)
    .single();

  if (existingUser) {
    throw new Error('Username already exists');
  }

  // If username is unique, proceed with creation
  const { data, error } = await supabase
    .from('system_users')
    .insert([{
      username: userData.username,
      password_hash: userData.password_hash,
      role: userData.role,
      hospital_id: userData.hospital_id
    }])
    .select()
    .single();

  if (error) {
    throw new Error('Error creating account: ' + error.message);
  }

  return data;
}

async function updateAccount(userId, userData) {
  const { data, error } = await supabase
    .from('system_users')
    .update({
      username: userData.username,
      role: userData.role,
      hospital_id: userData.hospital_id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error('Error updating account: ' + error.message);
  }

  return data;
}

module.exports = {
  fetchAccountDetails,
  fetchAllAccounts,
  createAccount,
  updateAccount
};
