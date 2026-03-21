const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(requireAuth, requireAdmin);

// ... existing code for auth, etc. ...
// This file assumes a basic structure as per user requirements
// Admin: Manually verify an existing user's email bypassing auth requirements
router.put('/users/:userId/verify', async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'User instantly verified!' });
});

// Admin: Create a new user pre-verified
router.post('/users', async (req, res) => {
    const { email, password, full_name, charity_id } = req.body;
    
    // Using Supabase Admin API bypasses email confirmation requirements
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, charity_id }
    });

    if (error) return res.status(400).json({ error: error.message });

    if (data?.user?.id && charity_id) {
        await supabase.from('profiles').update({ charity_id }).eq('id', data.user.id);
    }

    res.json({ message: 'User created and verified successfully by Admin', user: data.user });
});

router.post('/draws', async (req, res) => {
    const { draw_month, draw_mode, notes } = req.body;
    const { data, error } = await supabase.from('draws').insert([{
        draw_month, draw_mode, notes, status: 'pending'
    }]).select().single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/draws/:id/simulate', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get Draw
        const { data: draw, error: drawErr } = await supabase.from('draws').select('*').eq('id', id).single();
        if (drawErr || !draw) throw new Error("Draw not found");

        // 2. Get active users
        const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, subscription_plan').eq('subscription_status', 'active');
        if (profErr) throw new Error("Failed to fetch profiles");

        // 3. Get scores for active users
        const userIds = profiles.map(p => p.id);
        let scores = [];
        if (userIds.length > 0) {
            const { data: fetchedScores, error: scoreErr } = await supabase.from('scores').select('user_id, score').in('user_id', userIds);
            if (fetchedScores) scores = fetchedScores;
        }
        
        // Build draw entries payload
        const entriesMap = {};
        userIds.forEach(uid => entriesMap[uid] = []);
        scores.forEach(s => entriesMap[s.user_id].push(s.score));

        // Generate winning numbers (Random & Algorithmic fallback)
        let winning_numbers = [];
        while (winning_numbers.length < 5) {
            let r = Math.floor(Math.random() * 45) + 1;
            if (!winning_numbers.includes(r)) winning_numbers.push(r);
        }

        // Calculate matches
        const entriesToInsert = [];
        for (const [uid, userScores] of Object.entries(entriesMap)) {
            // take top 5 recent handled by DB trigger, so these are just the existing max 5
            const latestScores = userScores.slice(0, 5); 
            let matchCount = 0;
            latestScores.forEach(sc => {
                if (winning_numbers.includes(sc)) matchCount++;
            });
            entriesToInsert.push({
                draw_id: id,
                user_id: uid,
                scores: latestScores,
                match_count: [3, 4, 5].includes(matchCount) ? matchCount : 0,
                is_winner: matchCount >= 3
            });
        }

        // Mock prize pools based on subscribers (using config constants)
        // Assume £9.99 monthly, £99 yearly
        const subPoolPct = 0.60;
        const total = profiles.reduce((sum, p) => sum + (p.subscription_plan === 'yearly' ? 99 : 9.99), 0) * subPoolPct;
        const jackpot_pool = total * 0.40;
        const pool_4match = total * 0.35;
        const pool_3match = total * 0.25;

        // Insert Simulation
        // For a full implementation, delete existing entries for this draw_id first:
        await supabase.from('draw_entries').delete().eq('draw_id', id);
        if (entriesToInsert.length) {
            await supabase.from('draw_entries').insert(entriesToInsert);
        }

        // Update Draw State
        await supabase.from('draws').update({
            winning_numbers,
            status: 'simulated',
            jackpot_pool,
            pool_4match,
            pool_3match,
            total_subscribers: profiles.length,
            total_prize_pool: total
        }).eq('id', id);

        res.json({ success: true, winning_numbers, total_prize_pool: total });

    } catch (e) {
        console.error("Simulation error", e);
        res.status(500).json({ error: e.message || e });
    }
});

router.post('/draws/:id/publish', async (req, res) => {
    const { id } = req.params;
    const { data: draw, error: drawErr } = await supabase.from('draws').update({
        status: 'published',
        published_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (drawErr) return res.status(500).json({ error: drawErr.message });
    
    // In real app, trigger resend emails here to all users or winners
    res.json({ success: true, draw });
});

router.get('/reports', async (req, res) => {
    // Stub analytics summary
    const [subscribers, charities, drawsList] = await Promise.all([
        supabase.from('profiles').select('subscription_status'),
        supabase.from('charities').select('total_contributions'),
        supabase.from('draws').select('total_prize_pool')
    ]);

    const activeCount = (subscribers.data || []).filter(s => s.subscription_status === 'active').length;
    const totalContributed = (charities.data || []).reduce((sum, c) => sum + Number(c.total_contributions), 0);
    const totalPrizePoolAllTime = (drawsList.data || []).reduce((sum, d) => sum + Number(d.total_prize_pool || 0), 0);

    res.json({
        active_subscribers: activeCount,
        total_contributions: totalContributed,
        total_prizes: totalPrizePoolAllTime
    });
});

module.exports = router;
