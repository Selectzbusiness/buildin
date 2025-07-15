// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { in_code, in_user_id, in_product_type, in_purchase_amount } = await req.json()
    if (!in_code || !in_user_id || !in_product_type || !in_purchase_amount) {
      return new Response(JSON.stringify({ valid: false, message: 'Missing required fields' }), { headers: corsHeaders, status: 400 })
    }

    // Fetch coupon by code
    const { data: coupon, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', in_code)
      .maybeSingle()

    if (error || !coupon) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon not found' }), { headers: corsHeaders, status: 200 })
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon is not active' }), { headers: corsHeaders, status: 200 })
    }

    // Check date validity
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon is not yet valid' }), { headers: corsHeaders, status: 200 })
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon has expired' }), { headers: corsHeaders, status: 200 })
    }

    // Check usage limits
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon usage limit reached' }), { headers: corsHeaders, status: 200 })
    }

    // Check per-user usage
    if (coupon.max_uses_per_user) {
      const { count: userUsageCount } = await supabaseClient
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', in_user_id)
      if (userUsageCount && userUsageCount >= coupon.max_uses_per_user) {
        return new Response(JSON.stringify({ valid: false, message: 'Coupon usage limit reached for this user' }), { headers: corsHeaders, status: 200 })
      }
    }

    // Check min purchase amount
    if (coupon.min_purchase_amount && in_purchase_amount < coupon.min_purchase_amount) {
      return new Response(JSON.stringify({ valid: false, message: `Minimum purchase amount for this coupon is ₹${coupon.min_purchase_amount}` }), { headers: corsHeaders, status: 200 })
    }

    // Check applicable_to
    if (coupon.applicable_to && coupon.applicable_to.length > 0 && !coupon.applicable_to.includes(in_product_type)) {
      return new Response(JSON.stringify({ valid: false, message: 'Coupon not applicable for this product' }), { headers: corsHeaders, status: 200 })
    }

    // Calculate discount
    let discount_amount = 0
    if (coupon.discount_type === 'percentage') {
      discount_amount = Math.floor((in_purchase_amount * coupon.discount_value) / 100)
    } else if (coupon.discount_type === 'flat') {
      discount_amount = coupon.discount_value
    }
    discount_amount = Math.min(discount_amount, in_purchase_amount)

    return new Response(JSON.stringify({
      valid: true,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount,
      message: 'Coupon applied successfully!',
      coupon_id: coupon.id
    }), { headers: corsHeaders, status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, message: 'Internal error' }), { headers: corsHeaders, status: 500 })
  }
}) 