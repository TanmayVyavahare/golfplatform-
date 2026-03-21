const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(requireAuth);

// Admin: all winners list
router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('draw_entries').select('*, profiles(full_name, email)').eq('is_winner', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: verify winner
router.put('/:id/verify', requireAdmin, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const updates = { verification_status: status };
  if (status === 'approved') updates.payment_status = 'pending';
  
  const { error } = await supabase.from('draw_entries').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  
  res.json({ success: true });
});

// Admin: mark as paid
router.put('/:id/pay', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('draw_entries').update({ payment_status: 'paid' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// User: upload proof - NOTE: actual file upload should happen directly from frontend to Supabase Storage,
// then the frontend calls this to store the URL against the entry.
router.post('/:id/proof', async (req, res) => {
  const { proof_url } = req.body;
  
  // ensure user owns entry
  const { data: entry, error: entError } = await supabase.from('draw_entries').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (entError || !entry) return res.status(404).json({ error: 'Entry not found' });

  const { data, error } = await supabase.from('draw_entries').update({ 
    proof_url, 
    verification_status: 'pending' 
  }).eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
