-- Create function to access jobseeker profile with credit deduction
CREATE OR REPLACE FUNCTION access_job_seeker_profile(employer_id UUID, job_seeker_id UUID)
RETURNS JSON AS $$
DECLARE
    current_credits INTEGER;
    result JSON;
BEGIN
    -- Check if employer already has access
    IF EXISTS(
        SELECT 1 FROM employer_profile_views 
        WHERE employer_profile_views.employer_id = access_job_seeker_profile.employer_id 
        AND employer_profile_views.job_seeker_id = access_job_seeker_profile.job_seeker_id
    ) THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Access already granted'
        );
    END IF;

    -- Get current credits
    SELECT COALESCE(credits_balance, 0) INTO current_credits
    FROM employer_credits
    WHERE employer_credits.employer_id = access_job_seeker_profile.employer_id;

    -- If no credits record exists, create one
    IF current_credits IS NULL THEN
        INSERT INTO employer_credits (employer_id, credits_balance, total_purchased, total_used)
        VALUES (access_job_seeker_profile.employer_id, 0, 0, 0);
        current_credits := 0;
    END IF;

    -- Check if enough credits
    IF current_credits < 1 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits. Please purchase more credits.'
        );
    END IF;

    -- Deduct credit
    UPDATE employer_credits 
    SET 
        credits_balance = current_credits - 1,
        total_used = total_used + 1
    WHERE employer_credits.employer_id = access_job_seeker_profile.employer_id;

    -- Record profile view
    INSERT INTO employer_profile_views (employer_id, job_seeker_id, credits_used)
    VALUES (access_job_seeker_profile.employer_id, access_job_seeker_profile.job_seeker_id, 1);

    RETURN json_build_object(
        'success', true,
        'message', 'Profile access granted',
        'credits_remaining', current_credits - 1
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to process request'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION access_job_seeker_profile(UUID, UUID) TO authenticated; 