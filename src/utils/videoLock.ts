import { supabase } from '../config/supabase';

export interface VideoLockStatus {
  isLocked: boolean;
  remainingDays: number;
  canDelete: boolean;
  firstUploadDate: string | null;
}

/**
 * Check if a user's video is locked from deletion
 */
export const checkVideoLockStatus = async (userId: string): Promise<VideoLockStatus> => {
  try {
    // Get the profile data including first_video_uploaded_at
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_video_uploaded_at, intro_video_url')
      .eq('auth_id', userId)
      .single();

    if (error) {
      console.error('Error fetching video lock status:', error);
      return {
        isLocked: false,
        remainingDays: 0,
        canDelete: true,
        firstUploadDate: null
      };
    }

    // If no video or no first upload date, video is not locked
    if (!profile.intro_video_url || !profile.first_video_uploaded_at) {
      return {
        isLocked: false,
        remainingDays: 0,
        canDelete: true,
        firstUploadDate: null
      };
    }

    // Calculate days since first upload
    const firstUploadDate = new Date(profile.first_video_uploaded_at);
    const now = new Date();
    const daysSinceUpload = Math.floor((now.getTime() - firstUploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Video is locked if less than 20 days have passed
    const isLocked = daysSinceUpload < 20;
    const remainingDays = Math.max(0, 20 - daysSinceUpload);
    const canDelete = !isLocked;

    return {
      isLocked,
      remainingDays,
      canDelete,
      firstUploadDate: profile.first_video_uploaded_at
    };
  } catch (error) {
    console.error('Error checking video lock status:', error);
    return {
      isLocked: false,
      remainingDays: 0,
      canDelete: true,
      firstUploadDate: null
    };
  }
};

/**
 * Attempt to delete a video (will fail if video is locked)
 */
export const attemptVideoDeletion = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // First check if video can be deleted
    const lockStatus = await checkVideoLockStatus(userId);
    
    if (!lockStatus.canDelete) {
      return {
        success: false,
        error: `Video cannot be deleted for ${lockStatus.remainingDays} more days. You can replace it with a new video instead.`
      };
    }

    // If we can delete, proceed with deletion
    const { error } = await supabase
      .from('profiles')
      .update({ 
        intro_video_url: null,
        video_thumbnail_url: null,
        first_video_uploaded_at: null // Reset the lock when video is deleted
      })
      .eq('auth_id', userId);

    if (error) {
      return {
        success: false,
        error: 'Failed to delete video from database.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error attempting video deletion:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the video.'
    };
  }
};

/**
 * Format remaining days for display
 */
export const formatRemainingDays = (days: number): string => {
  if (days === 0) {
    return 'No lock period remaining';
  } else if (days === 1) {
    return '1 day remaining';
  } else {
    return `${days} days remaining`;
  }
};

/**
 * Get a user-friendly message about video lock status
 */
export const getVideoLockMessage = (lockStatus: VideoLockStatus): string => {
  if (!lockStatus.isLocked) {
    return 'You can delete your video at any time.';
  }
  
  return `Your video is locked for deletion. You can replace it with a new video, but cannot remove it completely for ${formatRemainingDays(lockStatus.remainingDays)}.`;
}; 