// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number
  currency: string
  description: string
  user_id: string
  payment_type: 'job_posting' | 'credits'
  credits_amount?: number
  job_id?: string
}

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { amount, currency, description, user_id, payment_type, credits_amount, job_id }: PaymentRequest = await req.json()

    // Validate request
    if (!amount || !currency || !description || !user_id || !payment_type) {
      throw new Error('Missing required fields')
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    })

    // Create Razorpay order
    const orderData = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: user_id,
        payment_type: payment_type,
        credits_amount: credits_amount?.toString() || '',
        job_id: job_id || '',
      }
    }

    const order: RazorpayOrder = await razorpay.orders.create(orderData)

    // Store payment intent in database
    const { error: dbError } = await supabaseClient
      .from('payment_intents')
      .insert({
        razorpay_order_id: order.id,
        user_id: user_id,
        amount: amount,
        currency: currency,
        description: description,
        payment_type: payment_type,
        credits_amount: credits_amount,
        job_id: job_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Payment error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Razorpay client class
class Razorpay {
  private keyId: string
  private keySecret: string
  private baseUrl = 'https://api.razorpay.com/v1'

  constructor(config: { key_id: string; key_secret: string }) {
    this.keyId = config.key_id
    this.keySecret = config.key_secret
  }

  async orders() {
    return {
      create: async (orderData: any) => {
        const response = await fetch(`${this.baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
          },
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          throw new Error(`Razorpay API error: ${response.statusText}`)
        }

        return await response.json()
      }
    }
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/razorpay-payment' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
