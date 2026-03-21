const supabase = require('../supabase');

const buildUserFromAuth = (user) => ({
  id: user.id,
  email: user.email,
  full_name: user.user_metadata?.full_name || user.email || 'User',
  role: user.app_metadata?.role || 'user',
  subscription_status: 'inactive',
  subscription_plan: 'free',
});

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorised: Missing or invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    // DEMO BYPASS: Allow frontend demo users to access protected routes
    if (token.startsWith('fake-demo-jwt-token-')) {
       const role = token.split('-').pop(); // viewer, paid, admin
       req.user = {
          id: `demo-uuid-${role}`,
          email: `${role}@demo.com`,
          full_name: role === 'admin' ? 'Admin Reviewer' : role === 'paid' ? 'Paid Subscriber' : 'Free Visitor',
          role: role === 'admin' ? 'admin' : 'user',
          subscription_status: role === 'viewer' ? 'inactive' : 'active',
          subscription_plan: role === 'viewer' ? 'free' : 'yearly',
       };
       return next();
    }

    // Verify token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorised: Invalid token' });
    }
    
    // Fetch user profile from profiles table to attach extra details (role, subscription_status, charity_id, etc)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
       // Keep auth working even if profile trigger has not populated yet.
       console.error("Error fetching user profile in auth middleware:", profileError);
       req.user = buildUserFromAuth(user);
    } else {
       req.user = profile;
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { requireAuth };
