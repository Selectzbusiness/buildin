-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NULL,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  max_uses integer NULL,
  used_count integer NULL DEFAULT 0,
  valid_from timestamp with time zone NULL,
  valid_to timestamp with time zone NULL,
  applicable_to text[] NULL,
  min_purchase_amount numeric NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  max_uses_per_user integer NULL,
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- Create coupon_usages table
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid NULL,
  user_id uuid NULL,
  used_at timestamp with time zone NULL DEFAULT now(),
  order_id text NULL,
  amount_before numeric NULL,
  amount_after numeric NULL,
  CONSTRAINT coupon_usages_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE,
  CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (auth_id) ON DELETE SET NULL
) TABLESPACE pg_default; 