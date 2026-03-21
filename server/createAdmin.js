require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'admin@golfy.com';
  const password = 'password123';
  
  console.log('Creating Admin Account...');
  
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' }
  });

  if (error && error.message !== 'User already registered') {
    return console.error('Error creating user:', error.message);
  }

  const userId = user?.user?.id;
  if (!userId) {
     const { data } = await supabase.from('profiles').select('id').eq('email', email).single();
     if(data) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.id);
        console.log(`Updated existing test user ${email} to be an Admin!`);
     }
     return;
  }

  await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  console.log(`Created new Admin User successfully: ${email} | ${password}`);
}

createAdmin();
