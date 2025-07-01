const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase.js');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get job by id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;