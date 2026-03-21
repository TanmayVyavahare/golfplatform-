const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.post('/signup', async (req, res) => {
    // Note: User creation should happen on the frontend via Supabase auth UI or library directly, 
    // but here we can just pass through to supabase.
    const { email, password, full_name, charity_id } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
            data: { full_name, charity_id }
        }
    });

    if (error) return res.status(400).json({ error: error.message });

    if (data && data.user && data.user.id && charity_id) {
        await supabase.from('profiles').update({ charity_id }).eq('id', data.user.id);
    }

    res.json({ message: 'Signup successful, please check email or login', user: data.user });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    
    // Fetch the enriched profile data to return to the frontend
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

    res.json({ token: data.session.access_token, user: profile || data.user });
});

module.exports = router;
