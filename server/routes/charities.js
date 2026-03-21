const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.get('/', async (req, res) => {
  // Public active charities
  const { data, error } = await supabase.from('charities').select('*').eq('is_active', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:slug', async (req, res) => {
  const { data, error } = await supabase.from('charities').select('*').eq('slug', req.params.slug).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
