// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  entity: {
    id: string
    amount: number
    currency: string
    status: string
    order_id: string
    payment_id: string
    notes: {
      user_id: string
      payment_type: string
      credits_amount?: string
      job_id?: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify webhook signature
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      throw new Error('Missing webhook signature or secret')
    }

    const body = await req.text()
    const expectedSignature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
    .then(signature => Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''))

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature')
    }

    const payload: WebhookPayload = JSON.parse(body)
    const { entity } = payload

    // Update payment intent status
    const { error: updateError } = await supabaseClient
      .from('payment_intents')
      .update({
        status: entity.status,
        razorpay_payment_id: entity.payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', entity.order_id)

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`)
    }

    // If payment is successful, process the payment
    if (entity.status === 'captured') {
      const { user_id, payment_type, credits_amount, job_id } = entity.notes

      if (payment_type === 'credits' && credits_amount) {
        // Add credits to user account
        const { error: creditsError } = await supabaseClient
          .from('employer_credits')
          .upsert({
            employer_id: user_id,
            credits_balance: parseInt(credits_amount),
            total_purchased: parseInt(credits_amount),
          }, {
            onConflict: 'employer_id'
          })

        if (creditsError) {
          console.error('Credits update error:', creditsError)
        }
      }

      if (payment_type === 'job_posting' && job_id) {
        // Activate the job posting
        const { error: jobError } = await supabaseClient
          .from('jobs')
          .update({
            status: 'active',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job_id)

        if (jobError) {
          console.error('Job activation error:', jobError)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/payment-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
