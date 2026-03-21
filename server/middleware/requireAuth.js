const supabase = require('../supabase');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorised: Missing or invalid token format' });
    }

    const token = authHeader.split('Bearer ')[1];
    
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
       // Profile might not be created immediately, but should be via trigger. We attach what we have.
       console.error("Error fetching user profile in auth middleware:", profileError);
       req.user = { id: user.id, email: user.email, app_metadata: user.app_metadata };
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
