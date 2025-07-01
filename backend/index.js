const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorMiddleware');

// Debug: Check environment variables and file path
console.log('Current working directory:', __dirname);
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'exists' : 'missing',
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV
});

// Only require supabase after we've confirmed env variables are loaded
const supabase = require('./config/supabase.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route to verify Supabase connection
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'success', 
      message: 'Supabase connection test', 
      connectionState: 'connected',
      data
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/internships', require('./routes/internshipRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});