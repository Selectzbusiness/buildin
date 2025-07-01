-- Create function to check if employer has access to jobseeker profile
CREATE OR REPLACE FUNCTION check_profile_access(employer_id UUID, job_seeker_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    -- Check if employer has viewed this profile before
    SELECT EXISTS(
        SELECT 1 
        FROM employer_profile_views 
        WHERE employer_profile_views.employer_id = check_profile_access.employer_id 
        AND employer_profile_views.job_seeker_id = check_profile_access.job_seeker_id
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_profile_access(UUID, UUID) TO authenticated;

-- Create function to get employer credits
CREATE OR REPLACE FUNCTION get_employer_credits(employer_id UUID)
RETURNS TABLE(
    credits_balance INTEGER,
    total_purchased INTEGER,
    total_used INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ec.credits_balance, 0) as credits_balance,
        COALESCE(ec.total_purchased, 0) as total_purchased,
        COALESCE(ec.total_used, 0) as total_used
    FROM employer_credits ec
    WHERE ec.employer_id = get_employer_credits.employer_id;
    
    -- If no record exists, return zeros
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employer_credits(UUID) TO authenticated; 