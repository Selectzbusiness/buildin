# Video Lock Feature

## Overview

The Video Lock feature prevents users from deleting their first uploaded video for a period of 20 days from the initial upload date. This encourages users to think carefully about their video content while still allowing them to replace videos with better versions.

## How It Works

### Backend Implementation

1. **Database Schema**: Uses the existing `first_video_uploaded_at` column in the `profiles` table
2. **Lock Period**: 20 days from the first video upload
3. **Replacement Allowed**: Users can replace videos anytime, but the lock period continues from the original upload date
4. **Deletion Prevention**: Video cannot be completely removed until the 20-day period expires

### Database Functions

- `can_delete_video(user_id)`: Returns boolean indicating if video can be deleted
- `get_video_lock_remaining_days(user_id)`: Returns number of days remaining in lock period
- `is_video_locked(user_id)`: Returns boolean indicating if video is currently locked

### Frontend Implementation

1. **Video Lock Status**: Displayed in the UploadsModal component
2. **Visual Indicators**: Lock icon and status message when video is locked
3. **Button States**: Delete button is disabled and shows lock status when video is locked
4. **User Information**: Clear messaging about the lock period and remaining days

## User Experience

### When Uploading First Video
- Users see a notice about the 20-day lock period before uploading
- Clear explanation that they can replace but not delete during this time

### When Video is Locked
- Delete button shows lock status with remaining days
- Visual lock icon and warning message
- Button is disabled to prevent deletion attempts

### When Video Can Be Deleted
- Normal delete functionality available
- No lock indicators shown

## Technical Details

### Database Migration
- File: `supabase/migrations/20241201000000_add_video_lock_fields.sql`
- Adds utility functions for video lock management
- Updates existing trigger to handle video replacement properly

### Frontend Files Modified
- `src/utils/videoLock.ts`: Utility functions for video lock logic
- `src/components/UploadsModal.tsx`: UI integration and lock status display

### Key Features
- **Scalable**: Uses existing database structure
- **User-Friendly**: Clear visual indicators and messaging
- **Flexible**: Allows video replacement while maintaining lock period
- **Secure**: Backend validation prevents unauthorized deletion

## Testing

To test the video lock feature:

1. Upload a video for the first time
2. Try to delete it immediately - should be prevented
3. Replace the video with a new one - should work
4. Try to delete again - should still be prevented
5. Wait for 20 days or manually adjust the database timestamp
6. Try to delete - should now be allowed

## Configuration

The lock period is currently set to 20 days but can be easily modified by changing the value in the database functions:

```sql
-- In the can_delete_video function, change 20 to desired number of days
RETURN days_since_upload >= 20;
```

## Future Enhancements

- Admin override for video deletion
- Different lock periods for different user types
- Analytics on video replacement frequency
- Email notifications when lock period is about to expire 