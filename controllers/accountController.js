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

async function updateAccount(userData) {
  // First check if username already exists for other users
  const { data: existingUser } = await supabase
    .from('system_users')
    .select('user_id')
    .eq('username', userData.username)
    .neq('user_id', userData.user_id)
    .single();

  if (existingUser) {
    throw new Error('Username already exists');
  }

  const updateData = {
    username: userData.username,
    role: userData.role,
    hospital_id: userData.hospital_id,
    updated_at: new Date().toISOString()
  };

  // If password was changed, include the new hash
  if (userData.password_hash) {
    updateData.password_hash = userData.password_hash;
  }

  const { data, error } = await supabase
    .from('system_users')
    .update(updateData)
    .eq('user_id', userData.user_id)
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
