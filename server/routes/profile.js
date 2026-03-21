const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/', async (req, res) => {
    // req.user has been populated by requireAuth middleware from 'profiles'
    res.json(req.user);
});

router.put('/', async (req, res) => {
    const { full_name, avatar_url, charity_id, charity_contribution_pct } = req.body;
    
    // Validate contribution
    if (charity_contribution_pct && charity_contribution_pct < 10) {
        return res.status(400).json({ error: 'Minimum charity contribution is 10%' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({ full_name, avatar_url, charity_id, charity_contribution_pct })
        .eq('id', req.user.id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

module.exports = router;
