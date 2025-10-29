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

  // Find the lowest available user_id (including gaps from deleted users)
  const { data: allUsers, error: fetchError } = await supabase
    .from('system_users')
    .select('user_id')
    .order('user_id', { ascending: true });

  if (fetchError) {
    throw new Error('Error fetching user IDs: ' + fetchError.message);
  }

  // Find the first gap in user_id sequence or use next available ID
  let nextUserId = 1;
  if (allUsers && allUsers.length > 0) {
    const existingIds = allUsers.map(u => u.user_id).sort((a, b) => a - b);
    
    // Find first gap in sequence
    for (let i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== nextUserId) {
        break; // Found a gap
      }
      nextUserId++;
    }
  }

  // If username is unique, proceed with creation using the specific user_id
  console.log('🔢 Attempting to create user with ID:', nextUserId);
  
  const { data, error } = await supabase
    .from('system_users')
    .insert([{
      user_id: nextUserId,
      username: userData.username,
      password_hash: userData.password_hash,
      role: userData.role,
      hospital_id: userData.hospital_id
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating account:', error);
    throw new Error('Error creating account: ' + error.message);
  }

  console.log('✅ Created user with ID:', data.user_id);
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
