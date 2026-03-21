const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');

router.get('/', async (req, res) => {
  // Public published draws list
  const { data, error } = await supabase.from('draws').select('*').eq('status', 'published').order('draw_month', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  // View draw details
  const { data: draw, error: drawError } = await supabase.from('draws').select('*').eq('id', req.params.id).single();
  if (drawError) return res.status(500).json({ error: drawError.message });
  
  // Try to find user entry
  const { data: entry, error: entryError } = await supabase.from('draw_entries').select('*').eq('draw_id', draw.id).eq('user_id', req.user.id).maybeSingle();
  res.json({ draw, entry: entry || null });
});

module.exports = router;
