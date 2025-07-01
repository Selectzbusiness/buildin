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

interface AnalyticsRequest {
  company_id: string
  action: 'process_daily' | 'process_realtime' | 'generate_report'
  date?: string
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

    const { company_id, action, date }: AnalyticsRequest = await req.json()

    if (!company_id || !action) {
      throw new Error('Missing required fields')
    }

    let result: any = {}

    switch (action) {
      case 'process_daily':
        // Process daily analytics
        result = await processDailyAnalytics(supabaseClient, company_id, date)
        break
      
      case 'process_realtime':
        // Process real-time analytics
        result = await processRealtimeAnalytics(supabaseClient, company_id)
        break
      
      case 'generate_report':
        // Generate comprehensive report
        result = await generateAnalyticsReport(supabaseClient, company_id)
        break
      
      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Analytics processor error:', error)
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

async function processDailyAnalytics(supabase: any, companyId: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  // Get daily job applications
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      jobs!inner(company_id)
    `)
    .eq('jobs.company_id', companyId)
    .gte('created_at', `${targetDate}T00:00:00`)
    .lt('created_at', `${targetDate}T23:59:59`)

  if (appError) throw appError

  // Calculate daily metrics
  const totalApplications = applications?.length || 0
  const shortlisted = applications?.filter((app: any) => app.status === 'shortlisted').length || 0
  const hired = applications?.filter((app: any) => app.status === 'hired').length || 0

  // Store daily analytics
  const { error: insertError } = await supabase
    .from('daily_analytics')
    .upsert({
      company_id: companyId,
      date: targetDate,
      total_applications: totalApplications,
      shortlisted_count: shortlisted,
      hired_count: hired,
      conversion_rate: totalApplications > 0 ? (hired / totalApplications) * 100 : 0,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'company_id,date'
    })

  if (insertError) throw insertError

  return {
    date: targetDate,
    total_applications: totalApplications,
    shortlisted_count: shortlisted,
    hired_count: hired,
    conversion_rate: totalApplications > 0 ? (hired / totalApplications) * 100 : 0,
  }
}

async function processRealtimeAnalytics(supabase: any, companyId: string) {
  // Get real-time metrics for the last 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: recentApplications, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      jobs!inner(company_id)
    `)
    .eq('jobs.company_id', companyId)
    .gte('created_at', yesterday.toISOString())

  if (appError) throw appError

  // Calculate real-time metrics
  const totalApplications = recentApplications?.length || 0
  const shortlisted = recentApplications?.filter((app: any) => app.status === 'shortlisted').length || 0
  const hired = recentApplications?.filter((app: any) => app.status === 'hired').length || 0

  return {
    period: 'last_24_hours',
    total_applications: totalApplications,
    shortlisted_count: shortlisted,
    hired_count: hired,
    conversion_rate: totalApplications > 0 ? (hired / totalApplications) * 100 : 0,
    processed_at: new Date().toISOString(),
  }
}

async function generateAnalyticsReport(supabase: any, companyId: string) {
  // Generate comprehensive analytics report
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)

  if (jobsError) throw jobsError

  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      jobs!inner(company_id)
    `)
    .eq('jobs.company_id', companyId)

  if (appError) throw appError

  // Calculate comprehensive metrics
  const totalJobs = jobs?.length || 0
  const activeJobs = jobs?.filter((job: any) => job.status === 'active').length || 0
  const totalApplications = applications?.length || 0
  const totalHired = applications?.filter((app: any) => app.status === 'hired').length || 0

  // Calculate average applications per job
  const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0

  // Calculate time to hire (simplified)
  const hiredApplications = applications?.filter((app: any) => app.status === 'hired') || []
  const avgTimeToHire = hiredApplications.length > 0 
    ? hiredApplications.reduce((acc: number, app: any) => {
        const appliedDate = new Date(app.created_at)
        const hiredDate = new Date(app.updated_at || app.created_at)
        return acc + (hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / hiredApplications.length
    : 0

  return {
    summary: {
      total_jobs: totalJobs,
      active_jobs: activeJobs,
      total_applications: totalApplications,
      total_hired: totalHired,
      conversion_rate: totalApplications > 0 ? (totalHired / totalApplications) * 100 : 0,
      avg_applications_per_job: avgApplicationsPerJob,
      avg_time_to_hire_days: avgTimeToHire,
    },
    generated_at: new Date().toISOString(),
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analytics-processor' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
