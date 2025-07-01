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
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the request body
    const { employer_id, job_seeker_id } = await req.json()

    if (!employer_id || !job_seeker_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if employer already has access to this profile
    const { data: existingAccess, error: accessError } = await supabaseClient
      .from('employer_profile_views')
      .select('id')
      .eq('employer_id', employer_id)
      .eq('job_seeker_id', job_seeker_id)
      .single()

    if (existingAccess) {
      return new Response(
        JSON.stringify({ success: true, message: 'Access already granted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if employer has enough credits
    const { data: credits, error: creditsError } = await supabaseClient
      .from('employer_credits')
      .select('credits_balance')
      .eq('employer_id', employer_id)
      .single()

    if (creditsError || !credits) {
      // Create credits record if it doesn't exist
      const { error: insertError } = await supabaseClient
        .from('employer_credits')
        .insert([{ employer_id, credits_balance: 0 }])

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to initialize credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (credits && credits.credits_balance < 1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits. Please purchase more credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct 1 credit and record the profile view
    const { error: deductError } = await supabaseClient
      .from('employer_credits')
      .update({ 
        credits_balance: credits ? credits.credits_balance - 1 : 0,
        total_used: credits ? credits.total_used + 1 : 1
      })
      .eq('employer_id', employer_id)

    if (deductError) {
      return new Response(
        JSON.stringify({ error: 'Failed to deduct credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record the profile view
    const { error: viewError } = await supabaseClient
      .from('employer_profile_views')
      .insert([{
        employer_id,
        job_seeker_id,
        credits_used: 1
      }])

    if (viewError) {
      return new Response(
        JSON.stringify({ error: 'Failed to record profile view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile access granted',
        credits_remaining: credits ? credits.credits_balance - 1 : 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 