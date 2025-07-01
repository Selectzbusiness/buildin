const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase.js');

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company by id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create company
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 