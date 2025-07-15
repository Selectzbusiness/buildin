CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  payment_type TEXT NOT NULL,
  credits_amount NUMERIC,
  job_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  razorpay_order_id TEXT,
  is_free BOOLEAN DEFAULT FALSE
); 