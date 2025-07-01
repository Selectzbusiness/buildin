-- Manual cleanup script for expired job drafts
-- Run this script periodically (daily/weekly) to clean up expired drafts

-- Delete drafts that have expired (older than 7 days)
DELETE FROM job_drafts 
WHERE expires_at < NOW();

-- Show how many drafts were deleted
SELECT 
    COUNT(*) as deleted_drafts,
    NOW() as cleanup_time
FROM job_drafts 
WHERE expires_at < NOW();

-- Optional: Show remaining drafts count by user
SELECT 
    user_id,
    COUNT(*) as active_drafts,
    MIN(expires_at) as earliest_expiry
FROM job_drafts 
GROUP BY user_id
ORDER BY active_drafts DESC;

-- Optional: Show drafts expiring soon (next 24 hours)
SELECT 
    id,
    draft_name,
    user_id,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 as hours_until_expiry
FROM job_drafts 
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
ORDER BY expires_at; 