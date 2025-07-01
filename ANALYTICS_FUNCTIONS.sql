-- Analytics Functions for Employer Dashboard
-- Run this SQL in your Supabase SQL Editor to create the analytics functions

-- Function to get employer summary statistics
CREATE OR REPLACE FUNCTION get_employer_summary(company_id UUID)
RETURNS TABLE (
    total_posted BIGINT,
    total_applications BIGINT,
    total_hired BIGINT,
    active_jobs BIGINT,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH job_stats AS (
        SELECT 
            COUNT(*) as total_jobs,
            COUNT(CASE WHEN j.status = 'active' THEN 1 END) as active_jobs
        FROM jobs j
        WHERE j.company_id = get_employer_summary.company_id
    ),
    application_stats AS (
        SELECT 
            COUNT(*) as total_applications,
            COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as total_hired
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = get_employer_summary.company_id
    )
    SELECT 
        js.total_jobs,
        COALESCE(aps.total_applications, 0),
        COALESCE(aps.total_hired, 0),
        js.active_jobs,
        CASE 
            WHEN COALESCE(aps.total_applications, 0) > 0 
            THEN ROUND((COALESCE(aps.total_hired, 0)::DECIMAL / aps.total_applications::DECIMAL) * 100, 2)
            ELSE 0 
        END as conversion_rate
    FROM job_stats js
    CROSS JOIN application_stats aps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get employer performance metrics by job
CREATE OR REPLACE FUNCTION get_employer_performance(company_id UUID)
RETURNS TABLE (
    job_id UUID,
    job_title TEXT,
    applications_count BIGINT,
    shortlisted_count BIGINT,
    hired_count BIGINT,
    conversion_rate DECIMAL,
    posted_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id as job_id,
        j.title as job_title,
        COALESCE(app_stats.applications_count, 0) as applications_count,
        COALESCE(app_stats.shortlisted_count, 0) as shortlisted_count,
        COALESCE(app_stats.hired_count, 0) as hired_count,
        CASE 
            WHEN COALESCE(app_stats.applications_count, 0) > 0 
            THEN ROUND((COALESCE(app_stats.hired_count, 0)::DECIMAL / app_stats.applications_count::DECIMAL) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        j.created_at as posted_date
    FROM jobs j
    LEFT JOIN (
        SELECT 
            a.job_id,
            COUNT(*) as applications_count,
            COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted_count,
            COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
        FROM applications a
        GROUP BY a.job_id
    ) app_stats ON j.id = app_stats.job_id
    WHERE j.company_id = get_employer_performance.company_id
    ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get applications time series data
CREATE OR REPLACE FUNCTION get_employer_applications_timeseries(company_id UUID, days INTEGER)
RETURNS TABLE (
    date DATE,
    applications_count BIGINT,
    shortlisted_count BIGINT,
    hired_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(a.created_at) as date,
        COUNT(*) as applications_count,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted_count,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = get_employer_applications_timeseries.company_id
    AND a.created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY DATE(a.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get candidate funnel data
CREATE OR REPLACE FUNCTION get_employer_candidate_funnel(company_id UUID)
RETURNS TABLE (
    stage TEXT,
    count BIGINT,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH funnel_data AS (
        SELECT 
            CASE 
                WHEN a.status = 'submitted' THEN 'Applied'
                WHEN a.status = 'viewed' THEN 'Viewed'
                WHEN a.status = 'shortlisted' THEN 'Shortlisted'
                WHEN a.status = 'hired' THEN 'Hired'
                ELSE 'Other'
            END as stage,
            COUNT(*) as count
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = get_employer_candidate_funnel.company_id
        GROUP BY a.status
    ),
    total_applications AS (
        SELECT SUM(count) as total FROM funnel_data
    )
    SELECT 
        fd.stage,
        fd.count,
        CASE 
            WHEN ta.total > 0 
            THEN ROUND((fd.count::DECIMAL / ta.total::DECIMAL) * 100, 2)
            ELSE 0 
        END as percentage
    FROM funnel_data fd
    CROSS JOIN total_applications ta
    ORDER BY 
        CASE fd.stage
            WHEN 'Applied' THEN 1
            WHEN 'Viewed' THEN 2
            WHEN 'Shortlisted' THEN 3
            WHEN 'Hired' THEN 4
            ELSE 5
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing job posts
CREATE OR REPLACE FUNCTION get_employer_top_posts(company_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    job_id UUID,
    job_title TEXT,
    applications_count BIGINT,
    conversion_rate DECIMAL,
    posted_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id as job_id,
        j.title as job_title,
        COALESCE(app_stats.applications_count, 0) as applications_count,
        CASE 
            WHEN COALESCE(app_stats.applications_count, 0) > 0 
            THEN ROUND((COALESCE(app_stats.hired_count, 0)::DECIMAL / app_stats.applications_count::DECIMAL) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        j.created_at as posted_date
    FROM jobs j
    LEFT JOIN (
        SELECT 
            a.job_id,
            COUNT(*) as applications_count,
            COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
        FROM applications a
        GROUP BY a.job_id
    ) app_stats ON j.id = app_stats.job_id
    WHERE j.company_id = get_employer_top_posts.company_id
    ORDER BY COALESCE(app_stats.applications_count, 0) DESC, conversion_rate DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity
CREATE OR REPLACE FUNCTION get_employer_recent_activity(company_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    activity_type TEXT,
    job_title TEXT,
    candidate_name TEXT,
    activity_date TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Application' as activity_type,
        j.title as job_title,
        p.full_name as candidate_name,
        a.created_at as activity_date,
        a.status
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN profiles p ON a.job_seeker_id = p.id
    WHERE j.company_id = get_employer_recent_activity.company_id
    ORDER BY a.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION get_employer_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_applications_timeseries(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_candidate_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_top_posts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_recent_activity(UUID, INTEGER) TO authenticated; 