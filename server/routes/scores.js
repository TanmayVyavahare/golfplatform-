const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');
const { requireActiveSubscription } = require('../middleware/requireActiveSubscription');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', req.user.id)
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireActiveSubscription, async (req, res) => {
  const { score, played_at } = req.body;
  if (!score || score < 1 || score > 45) {
      return res.status(400).json({ error: 'Valid stableford score required (1-45)' });
  }

  const { data, error } = await supabase
    .from('scores')
    .insert([{ user_id: req.user.id, score, played_at }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
});

router.put('/:id', requireActiveSubscription, async (req, res) => {
  const { score, played_at } = req.body;
  const { data, error } = await supabase
    .from('scores')
    .update({ score, played_at })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
