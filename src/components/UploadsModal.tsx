import React, { useState, useRef, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import useIsMobile from '../hooks/useIsMobile';
import { FiUpload, FiCamera, FiLock, FiUnlock } from 'react-icons/fi';
import { 
  checkVideoLockStatus, 
  attemptVideoDeletion, 
  getVideoLockMessage, 
  formatRemainingDays,
  type VideoLockStatus 
} from '../utils/videoLock';

// Video validation constants
const MAX_VIDEO_DURATION = 60; // 60 seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_VIDEO_DURATION = 10; // 10 seconds
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

interface UploadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VideoState = 'initial' | 'recording' | 'preview' | 'details' | 'saved';
type ResumeState = 'initial' | 'uploaded' | 'saved';

const UploadsModal: React.FC<UploadsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useContext(AuthContext);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'videos' | 'resumes'>('videos');
  
  // Video states
  const [videoState, setVideoState] = useState<VideoState>('initial');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  
  // Video validation and processing states
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoFileSize, setVideoFileSize] = useState<number>(0);
  const [videoValidationError, setVideoValidationError] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  
  // Resume states
  const [resumeState, setResumeState] = useState<ResumeState>('initial');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  
  // Form data
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [desiredLocation, setDesiredLocation] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Add state for play overlay
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Video lock states
  const [videoLockStatus, setVideoLockStatus] = useState<VideoLockStatus>({
    isLocked: false,
    remainingDays: 0,
    canDelete: true,
    firstUploadDate: null
  });

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchExistingData();
    }
  }, [isOpen, user]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
    }
  }, [isOpen]);

  // Cleanup video preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const fetchExistingData = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching existing data for user:', user.id);
      
      // Get the existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('intro_video_url, resume_url, desired_roles, desired_location')
        .eq('auth_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        setError('Failed to load existing data. Please try again.');
        return;
      }

      if (data) {
        console.log('Profile data loaded:', data);
        if (data.intro_video_url) {
          setExistingVideoUrl(data.intro_video_url);
          setVideoState('saved');
          
          // Fetch video lock status
          const lockStatus = await checkVideoLockStatus(user.id);
          setVideoLockStatus(lockStatus);
        } else {
          setExistingVideoUrl(null);
          setVideoState('initial');
          setVideoLockStatus({
            isLocked: false,
            remainingDays: 0,
            canDelete: true,
            firstUploadDate: null
          });
        }
        if (data.resume_url) {
          setExistingResumeUrl(data.resume_url);
          setResumeState('saved');
        } else {
          setExistingResumeUrl(null);
          setResumeState('initial');
        }
        setDesiredRoles(data.desired_roles || []);
        setDesiredLocation(data.desired_location || '');
      } else {
        console.log('No existing profile found, will create one when needed');
        // Don't create profile here, let the upsert handle it
        setDesiredRoles([]);
        setDesiredLocation('');
        setExistingVideoUrl(null);
        setExistingResumeUrl(null);
        setVideoState('initial');
        setResumeState('initial');
        setVideoLockStatus({
          isLocked: false,
          remainingDays: 0,
          canDelete: true,
          firstUploadDate: null
        });
      }
    } catch (err: any) {
      console.error('Error fetching existing data:', err);
      setError('Failed to load existing data. Please try again.');
    }
  };

  // Cleanup streams and reset states
  const cleanupStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    recordedChunksRef.current = [];
    setRecordedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setIsRecording(false);
    setCountdown(null);
  };

  const startRecording = async () => {
    try {
      if (streamRef.current) {
        cleanupStreams();
      }
      
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true,
      });
      
      console.log('Camera access granted, setting up preview...');
      streamRef.current = stream;

      // Set video state first so the video element renders
      setVideoState('recording');
      
      // Wait for the component to re-render and then set up the video
      setTimeout(() => {
        setupVideoPreview(stream);
      }, 100);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access camera. Please check permissions and try again.');
      setVideoState('initial');
    }
  };

  const setupVideoPreview = async (stream: MediaStream) => {
    // Show live camera preview immediately
    if (videoRef.current) {
      console.log('Setting video element properties...');
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true; // Prevent echo
      videoRef.current.playsInline = true; // Important for mobile
      videoRef.current.autoplay = true;
      
      // Ensure video plays
      try {
        console.log('Attempting to play video...');
        await videoRef.current.play();
        console.log('Video playback started successfully');
      } catch (playError) {
        console.warn('Auto-play failed, user may need to interact first:', playError);
        // Try to play again after a short delay
        setTimeout(async () => {
          try {
            await videoRef.current?.play();
            console.log('Video playback started after delay');
          } catch (retryError) {
            console.error('Failed to play video after retry:', retryError);
          }
        }, 100);
      }
    } else {
      console.error('Video element not found');
    }

    // Start countdown after video is set up
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        startMediaRecorder(stream);
      }
    }, 1000);
  };

  const startMediaRecorder = (stream: MediaStream) => {
    let options: MediaRecorderOptions = {};
    
    // Try different mime types in order of preference
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
        break;
      }
    }
    
    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      setError('Your browser does not support video recording. Please try a different browser.');
      setIsRecording(false);
      return;
    }
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `intro_video_${uuidv4()}.webm`, { type: 'video/webm' });
      
      console.log('Recording stopped, blob size:', blob.size, 'bytes');
      console.log('Created file:', file.name, 'size:', file.size, 'bytes');
      
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size exceeds 50MB limit. Please record a shorter video.');
        setVideoState('initial');
        recordedChunksRef.current = [];
        return;
      }

      try {
        // Process the recorded video to ensure compatibility
        console.log('Processing recorded video...');
        const { processedFile, thumbnail, duration } = await processVideo(file);
        
        console.log('Video processing completed successfully');
        console.log('Processed duration:', duration, 'seconds');
        console.log('Processed file size:', processedFile.size, 'bytes');
        
        setRecordedVideo(processedFile);
        setVideoDuration(duration);
        setVideoFileSize(processedFile.size);
        setVideoThumbnail(thumbnail);
        
        // Create preview URL from the processed file
        const previewUrl = URL.createObjectURL(processedFile);
        console.log('Video preview URL created:', previewUrl);
        console.log('Processed file type:', processedFile.type);
        console.log('Processed file size:', processedFile.size);
        setVideoPreview(previewUrl);
        setVideoState('preview');
      } catch (error: any) {
        console.error('Error processing recorded video:', error);
        // Fallback to original blob if processing fails
        console.log('Using fallback video blob');
        setRecordedVideo(file);
        const previewUrl = URL.createObjectURL(blob);
        console.log('Fallback video preview URL:', previewUrl);
        setVideoPreview(previewUrl);
        setVideoState('preview');
      }
      
      setIsRecording(false);
      recordedChunksRef.current = [];
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const retakeVideo = () => {
    setVideoState('initial');
    cleanupStreams();
  };

  const confirmVideo = () => {
    setVideoState('details');
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setVideoValidationError(null);

    try {
      // Process video with validation, compression, and thumbnail generation
      const { processedFile, thumbnail, duration } = await processVideo(file);
      
      // Update state with processed video
      setRecordedVideo(processedFile);
      setVideoDuration(duration);
      setVideoFileSize(processedFile.size);
      setVideoThumbnail(thumbnail);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(processedFile);
      setVideoPreview(previewUrl);
      setVideoState('details');
      
    } catch (error: any) {
      console.error('Video processing error:', error);
      setVideoValidationError(error.message || 'Failed to process video');
      setError(error.message || 'Failed to process video');
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, DOC, or DOCX file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Resume file size cannot exceed 10MB.');
        return;
      }
      
      setResumeFile(file);
      setResumeState('uploaded');
    }
  };

  const addRole = () => {
    const trimmedRole = newRole.trim();
    if (trimmedRole && desiredRoles.length < 7 && trimmedRole.length <= 50) {
      if (desiredRoles.includes(trimmedRole)) {
        setError('This role is already added.');
        return;
      }
      setDesiredRoles(prev => [...prev, trimmedRole]);
      setNewRole('');
      setError(null);
    } else if (trimmedRole.length > 50) {
      setError('Role name cannot exceed 50 characters.');
    }
  };

  const removeRole = (index: number) => {
    setDesiredRoles(prev => prev.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    if (!user) {
      setError('You must be logged in to save changes.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let videoUrl = existingVideoUrl;
      let videoThumbnailUrl = null;
      let resumeUrl = existingResumeUrl;

      if (activeTab === 'videos' && recordedVideo) {
        setUploadProgress(25);
        const videoFileName = `${user.id}/${uuidv4()}_intro.webm`;
        const { data: videoData, error: videoError } = await supabase.storage
          .from('job-seeker-intro-videos')
          .upload(videoFileName, recordedVideo, {
            cacheControl: '3600',
            upsert: true
          });

        if (videoError) throw videoError;
        setUploadProgress(50);
        videoUrl = supabase.storage.from('job-seeker-intro-videos').getPublicUrl(videoData.path).data.publicUrl;

        // Upload thumbnail if available
        if (videoThumbnail) {
          setUploadProgress(60);
          const thumbnailFileName = `${user.id}/${uuidv4()}_thumbnail.jpg`;
          
          // Convert thumbnail URL to blob
          const response = await fetch(videoThumbnail);
          const thumbnailBlob = await response.blob();
          
          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('job-seeker-thumbnails')
            .upload(thumbnailFileName, thumbnailBlob, {
              cacheControl: '3600',
              upsert: true
            });

          if (thumbnailError) {
            console.warn('Failed to upload thumbnail:', thumbnailError);
          } else {
            videoThumbnailUrl = supabase.storage.from('job-seeker-thumbnails').getPublicUrl(thumbnailData.path).data.publicUrl;
          }
        }
      }

      if (activeTab === 'resumes' && resumeFile) {
        setUploadProgress(75);
        const resumeFileName = `${user.id}/${uuidv4()}_resume.${resumeFile.name.split('.').pop()}`;
        const { data: resumeData, error: resumeError } = await supabase.storage
          .from('job-seeker-resumes')
          .upload(resumeFileName, resumeFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (resumeError) throw resumeError;
        resumeUrl = supabase.storage.from('job-seeker-resumes').getPublicUrl(resumeData.path).data.publicUrl;
      }

      if (activeTab === 'videos' && (!desiredRoles.length || !desiredLocation.trim())) {
        setError('Desired roles and location are mandatory.');
        setLoading(false);
        setUploadProgress(0);
        return;
      }

      if (desiredLocation.trim().length > 100) {
        setError('Location cannot exceed 100 characters.');
        setLoading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(90);
      
      // Use upsert to either update existing profile or create new one
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          auth_id: user.id,
          intro_video_url: videoUrl,
          video_thumbnail_url: videoThumbnailUrl,
          resume_url: resumeUrl,
          desired_roles: desiredRoles,
          desired_location: desiredLocation.trim()
        }, {
          onConflict: 'auth_id' // Specify the conflict resolution column
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      if (activeTab === 'videos') {
        setExistingVideoUrl(videoUrl);
        setVideoState('saved');
        
        // Refresh video lock status after saving
        const lockStatus = await checkVideoLockStatus(user.id);
        setVideoLockStatus(lockStatus);
      } else {
        setExistingResumeUrl(resumeUrl);
        setResumeState('saved');
      }

      setSuccess('Changes saved successfully!');
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setSuccess(null);
      }, 5000);

      if (activeTab === 'videos') {
        await refreshProfile();
      }

    } catch (err: any) {
      console.error('Error saving changes:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteVideo = async () => {
    if (!user || !existingVideoUrl) return;

    // Check video lock status first
    const lockStatus = await checkVideoLockStatus(user.id);
    
    if (!lockStatus.canDelete) {
      setError(`Video cannot be deleted for ${formatRemainingDays(lockStatus.remainingDays)}. You can replace it with a new video instead.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete your video? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the video lock utility to attempt deletion
      const result = await attemptVideoDeletion(user.id);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete video.');
        return;
      }

      // If database deletion was successful, remove from storage
      const videoFileName = existingVideoUrl.split('/').pop();
      if (videoFileName) {
        await supabase.storage
          .from('job-seeker-intro-videos')
          .remove([`${user.id}/${videoFileName}`]);
      }

      setExistingVideoUrl(null);
      setVideoState('initial');
      setVideoLockStatus({
        isLocked: false,
        remainingDays: 0,
        canDelete: true,
        firstUploadDate: null
      });
      setSuccess('Video deleted successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      await refreshProfile();

    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async () => {
    if (!user || !existingResumeUrl) return;

    if (!window.confirm('Are you sure you want to delete your resume? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resumeFileName = existingResumeUrl.split('/').pop();
      if (resumeFileName) {
        await supabase.storage
          .from('job-seeker-resumes')
          .remove([`${user.id}/${resumeFileName}`]);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ resume_url: null })
        .eq('auth_id', user.id);

      if (error) throw error;

      setExistingResumeUrl(null);
      setResumeState('initial');
      setSuccess('Resume deleted successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      await refreshProfile();

    } catch (err: any) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const editVideo = () => {
    setVideoState('initial');
    cleanupStreams();
  };

  const editDetails = () => {
    if (activeTab === 'videos') {
      setVideoState('details');
    }
  };

  // Video validation and processing functions
  const validateVideo = (file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be under ${MAX_FILE_SIZE / (1024 * 1024)}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
      };
    }

    // Check file format
    if (!ALLOWED_VIDEO_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: `File format not supported. Please use MP4, WebM, OGG, or MOV files.`
      };
    }

    return { isValid: true };
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Check if duration is valid (not Infinity or NaN)
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          resolve(video.duration);
        } else {
          // For recorded videos, we might need to wait a bit more
          setTimeout(() => {
            if (video.duration && isFinite(video.duration) && video.duration > 0) {
              resolve(video.duration);
            } else {
              // If still not available, try to estimate from file size
              // This is a rough estimation: ~1MB per second for webm
              const estimatedDuration = Math.max(1, Math.min(60, file.size / (1024 * 1024)));
              console.log('Using estimated duration:', estimatedDuration, 'seconds');
              resolve(estimatedDuration);
            }
          }, 1000);
        }
      };
      
      video.onerror = () => {
        // Fallback to file size estimation
        const estimatedDuration = Math.max(1, Math.min(60, file.size / (1024 * 1024)));
        console.log('Video metadata failed to load, using estimated duration:', estimatedDuration, 'seconds');
        resolve(estimatedDuration);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const generateThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        // Set canvas size
        canvas.width = 320;
        canvas.height = 180;
        
        // Seek to 1 second or middle of video
        const seekTime = Math.min(1, video.duration / 2);
        video.currentTime = seekTime;
      };
      
      video.onseeked = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              resolve(thumbnailUrl);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const compressVideo = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        // Set canvas size for compression (720p)
        canvas.width = 1280;
        canvas.height = 720;
        
        // Start video playback
        video.play();
      };
      
      video.onplay = () => {
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm'
          });
          resolve(compressedFile);
        };
        
        // Draw video frames to canvas
        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };
        
        mediaRecorder.start();
        drawFrame();
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video for compression'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const processVideo = async (file: File): Promise<{ processedFile: File; thumbnail: string; duration: number }> => {
    setIsProcessingVideo(true);
    setProcessingProgress(0);
    
    try {
      // Step 1: Validate video
      setProcessingProgress(10);
      const validation = validateVideo(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Step 2: Get video duration
      setProcessingProgress(20);
      const duration = await getVideoDuration(file);
      
      // For recorded videos, be more lenient with duration validation
      const isRecordedVideo = file.type === 'video/webm' && file.name.includes('intro_video_');
      
      if (!isRecordedVideo) {
        // Strict validation for uploaded videos
        if (duration < MIN_VIDEO_DURATION) {
          throw new Error(`Video must be at least ${MIN_VIDEO_DURATION} seconds long. Current duration: ${duration.toFixed(1)}s`);
        }
        if (duration > MAX_VIDEO_DURATION) {
          throw new Error(`Video must be under ${MAX_VIDEO_DURATION} seconds long. Current duration: ${duration.toFixed(1)}s`);
        }
      } else {
        // For recorded videos, only check if it's too long (allow short videos)
        if (duration > MAX_VIDEO_DURATION) {
          throw new Error(`Video must be under ${MAX_VIDEO_DURATION} seconds long. Current duration: ${duration.toFixed(1)}s`);
        }
        // For recorded videos, if duration is estimated, use a reasonable default
        if (duration < MIN_VIDEO_DURATION && file.size < 1024 * 1024) {
          console.log('Recorded video appears to be too short, but allowing it to proceed');
        }
      }

      // Step 3: Generate thumbnail
      setProcessingProgress(40);
      const thumbnail = await generateThumbnail(file);

      // Step 4: Compress video if needed
      setProcessingProgress(60);
      let processedFile = file;
      if (file.size > 10 * 1024 * 1024) { // Compress if > 10MB
        processedFile = await compressVideo(file);
      }

      setProcessingProgress(100);
      
      return { processedFile, thumbnail, duration };
    } catch (error) {
      throw error;
    } finally {
      setIsProcessingVideo(false);
      setProcessingProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Your Profile</h2>
            <p className="text-gray-500 mt-1">Upload your introduction video and resume to stand out</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-6 px-8 text-center font-semibold transition-all duration-200 relative ${
              activeTab === 'videos'
                ? 'text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Videos tab"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Introduction Video</span>
            </div>
            {activeTab === 'videos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`flex-1 py-6 px-8 text-center font-semibold transition-all duration-200 relative ${
              activeTab === 'resumes'
                ? 'text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Resumes tab"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Resume</span>
            </div>
            {activeTab === 'resumes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Success Message */}
          {showSuccess && success && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-2xl flex items-center space-x-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 rounded-2xl flex items-center space-x-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-900">Oops! Something went wrong</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="font-semibold text-blue-900">Uploading your file...</span>
                </div>
                <span className="font-bold text-blue-600 text-lg">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Video Processing Progress */}
          {isProcessingVideo && processingProgress > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-purple-900">Processing video...</span>
                </div>
                <span className="font-bold text-purple-600 text-lg">{processingProgress}%</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="mt-3 text-sm text-purple-700">
                {processingProgress < 20 && "Validating video format and size..."}
                {processingProgress >= 20 && processingProgress < 40 && "Checking video duration..."}
                {processingProgress >= 40 && processingProgress < 60 && "Generating thumbnail..."}
                {processingProgress >= 60 && processingProgress < 100 && "Compressing video..."}
                {processingProgress === 100 && "Video processing complete!"}
              </div>
            </div>
          )}

          {/* Video Validation Error */}
          {videoValidationError && (
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 text-orange-800 rounded-2xl flex items-center space-x-4 shadow-lg">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-orange-900">Video Validation Error</p>
                <p className="text-orange-700">{videoValidationError}</p>
              </div>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-8">
              {/* Initial State */}
              {videoState === 'initial' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                      {isMobile ? 'Create Your Video' : 'Create Your Introduction Video'}
                    </h3>
                    <p className="text-gray-600 max-w-lg mx-auto text-lg leading-relaxed">
                      Share your story and make a lasting impression. Keep it between 10-60 seconds and under 50MB.
                    </p>
                    <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        MP4, WebM, OGG, MOV
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Up to 50MB
                      </span>
                    </div>
                  </div>
                  
                  {isMobile ? (
                    <div className="space-y-6">
                      {/* Upload Existing Video - Mobile */}
                      <div className="group">
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="hidden"
                            aria-label="Upload video file"
                          />
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-3xl p-8 text-center hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl">
                            <div className="space-y-4">
                              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-gray-900">Upload Video</p>
                                <p className="text-gray-600 mt-2">Select from your gallery</p>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Record New Video - Mobile */}
                      <div className="group">
                        <button
                          onClick={startRecording}
                          className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-3xl p-8 text-center hover:border-green-400 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 group-hover:scale-[1.02] focus:outline-none shadow-lg hover:shadow-xl"
                          aria-label="Record new video"
                          type="button"
                        >
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xl font-bold text-gray-900">Record Video</p>
                              <p className="text-gray-600 mt-2">Use your camera</p>
                            </div>
                          </div>
                        </button>
                      </div>
                      
                      {/* Video Lock Period Notice - Mobile */}
                      <div className="mt-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                          <div className="flex items-start space-x-3">
                            <FiLock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-blue-800 font-semibold text-sm">
                                Video Lock Period
                              </p>
                              <p className="text-blue-700 text-xs mt-1">
                                Once you save your first video, it will be locked for deletion for 20 days. You can replace it anytime, but cannot remove it completely during this period.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Upload Existing Video - Desktop */}
                        <div className="group">
                          <label className="block cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoFileChange}
                              className="hidden"
                              aria-label="Upload video file"
                            />
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-3xl p-12 text-center hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group-hover:scale-[1.02] shadow-xl hover:shadow-2xl min-h-[300px] flex flex-col justify-center">
                              <div className="space-y-6">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900 mb-2">Upload Video</p>
                                  <p className="text-gray-600 text-lg">Select a video file from your device</p>
                                  <p className="text-gray-500 mt-2 text-sm">Drag and drop or click to browse</p>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Record New Video - Desktop */}
                        <div className="group">
                          <button
                            onClick={startRecording}
                            className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-3xl p-12 text-center hover:border-green-400 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 group-hover:scale-[1.02] focus:outline-none shadow-xl hover:shadow-2xl min-h-[300px] flex flex-col justify-center"
                            aria-label="Record new video"
                            type="button"
                          >
                            <div className="space-y-6">
                              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900 mb-2">Record Video</p>
                                <p className="text-gray-600 text-lg">Use your camera to record directly</p>
                                <p className="text-gray-500 mt-2 text-sm">Perfect lighting recommended</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-8 max-w-2xl mx-auto">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                          <div className="flex items-start space-x-4">
                            <FiLock className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-blue-800 font-semibold text-base">
                                Video Lock Period
                              </p>
                              <p className="text-blue-700 text-sm mt-2">
                                Once you save your first video, it will be locked for deletion for 20 days. You can replace it anytime, but cannot remove it completely during this period.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Recording State */}
              {videoState === 'recording' && (
                <div className={isMobile ? 'fixed inset-0 bg-black z-50' : 'space-y-6'}>
                  {!isMobile && (
                    <div className="text-center">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                        Recording Your Video
                      </h3>
                      <p className="text-gray-600 text-lg">Position yourself in the frame and speak clearly</p>
                    </div>
                  )}
                  
                  <div className={isMobile ? 'relative w-full h-full' : 'relative w-full max-w-4xl mx-auto'}>
                    <div className={isMobile ? 'relative w-full h-full bg-black' : `relative w-full h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-700`}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Countdown overlay */}
                      {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md">
                          <div className="text-center">
                            <div className={`font-bold text-white animate-pulse mb-6 drop-shadow-2xl ${isMobile ? 'text-8xl' : 'text-9xl'}`}>{countdown}</div>
                            <p className="text-white/90 text-2xl font-medium">Get ready...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Recording indicator */}
                      {isRecording && (
                        <div className={`absolute ${isMobile ? 'top-12 right-4' : 'top-6 right-6'} flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full shadow-2xl border-2 border-red-400 backdrop-blur-sm`}>
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="font-bold text-sm">REC</span>
                        </div>
                      )}
                      
                      {/* Recording overlay */}
                      {isRecording && (
                        <div className={`absolute ${isMobile ? 'bottom-20 left-4 right-4' : 'bottom-6 left-6 right-6'}`}>
                          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
                            <div className="flex items-center justify-center space-x-4">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-white font-semibold text-lg">Recording in progress...</span>
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera controls overlay */}
                      <div className={`absolute ${isMobile ? 'bottom-8 left-1/2 transform -translate-x-1/2' : 'bottom-6 left-1/2 transform -translate-x-1/2'}`}>
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            className={`group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full font-bold transition-all duration-300 hover:scale-110 shadow-2xl border-2 border-red-400 backdrop-blur-sm ${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'}`}
                            aria-label="Stop recording"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`bg-white rounded-sm group-hover:scale-110 transition-transform ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`}></div>
                              <span>{isMobile ? 'Stop' : 'Stop Recording'}</span>
                            </div>
                          </button>
                        ) : (
                          <div className="bg-black/50 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                            <div className="flex items-center space-x-3 text-white">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">Camera active</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mobile close button */}
                      {isMobile && (
                        <button
                          onClick={() => {
                            cleanupStreams();
                            setVideoState('initial');
                          }}
                          className="absolute top-12 left-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
                          aria-label="Close recording"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {!isMobile && !isRecording && countdown !== null && (
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-8 py-5 rounded-2xl border border-blue-200 shadow-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">Camera preview active</p>
                          <p className="text-blue-700">Recording starts in {countdown} seconds...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview State */}
              {videoState === 'preview' && (
                <div className={isMobile ? 'fixed inset-0 bg-black z-50' : 'space-y-8'}>
                  {!isMobile && (
                    <div className="text-center">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                        Preview Your Video
                      </h3>
                      <p className="text-gray-600 text-lg">Review your recording before proceeding</p>
                    </div>
                  )}
                  
                  <div className={isMobile ? 'relative w-full h-full' : 'w-full max-w-4xl mx-auto'}>
                    <div className={isMobile ? 'relative w-full h-full bg-black' : `w-full h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-700`}>
                      <video
                        ref={videoPreviewRef}
                        src={videoPreview || ''}
                        controls={!isMobile}
                        className="w-full h-full object-cover"
                        controlsList="nodownload"
                        preload="metadata"
                        playsInline
                        autoPlay={false}
                        muted={false}
                        style={{ 
                          objectFit: 'contain',
                          backgroundColor: 'black'
                        }}
                        onError={(e) => {
                          console.error('Video preview error:', e);
                          console.error('Video element error details:', e.currentTarget.error);
                          setError('Failed to load video preview. Please try recording again.');
                        }}
                        onLoadedData={(e) => {
                          console.log('Video preview loaded successfully');
                          console.log('Video duration:', e.currentTarget.duration);
                          console.log('Video ready state:', e.currentTarget.readyState);
                          if (isMobile) setShowPlayOverlay(true);
                        }}
                        onCanPlay={() => {
                          console.log('Video can play');
                        }}
                        onLoadStart={() => {
                          console.log('Video load started');
                        }}
                        onPlay={() => {
                          if (isMobile) setShowPlayOverlay(false);
                        }}
                        onPause={() => {
                          if (isMobile) setShowPlayOverlay(true);
                        }}
                        onClick={() => {
                          if (isMobile && !showPlayOverlay) {
                            // Pause video if playing and overlay is hidden
                            videoPreviewRef.current?.pause();
                          }
                        }}
                      />
                      {/* Play overlay for mobile */}
                      {isMobile && showPlayOverlay && (
                        <button
                          type="button"
                          className="absolute inset-0 flex items-center justify-center z-10 focus:outline-none"
                          style={{ pointerEvents: 'auto' }}
                          aria-label="Play video"
                          onClick={() => {
                            videoPreviewRef.current?.play();
                            setShowPlayOverlay(false);
                          }}
                        >
                          <span className="bg-black/60 rounded-full p-6 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.3)" />
                              <polygon points="26,20 50,32 26,44" fill="white" />
                            </svg>
                          </span>
                        </button>
                      )}
                      {/* Fallback message if video fails to load */}
                      {!videoPreview && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-semibold">Video Preview</p>
                            <p className="text-gray-400">Your recorded video will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex justify-center space-x-6 ${isMobile ? 'absolute bottom-8 left-4 right-4' : ''}`}>
                    <button
                      onClick={retakeVideo}
                      className={`group bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-xl border-2 border-gray-400 ${isMobile ? 'px-6 py-3 text-base flex-1' : 'px-8 py-4 text-lg'}`}
                      aria-label="Retake video"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className={`group-hover:rotate-180 transition-transform duration-300 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{isMobile ? 'Retake' : 'Retake Video'}</span>
                      </div>
                    </button>
                    <button
                      onClick={confirmVideo}
                      className={`group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-xl border-2 border-blue-400 ${isMobile ? 'px-6 py-3 text-base flex-1' : 'px-8 py-4 text-lg'}`}
                      aria-label="Confirm video"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className={`group-hover:scale-110 transition-transform ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{isMobile ? 'Use Video' : 'Use This Video'}</span>
                      </div>
                    </button>
                  </div>

                  {/* Mobile close button */}
                  {isMobile && (
                    <button
                      onClick={() => {
                        setVideoState('initial');
                      }}
                      className="absolute top-12 left-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
                      aria-label="Close preview"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* Mobile video instruction */}
                  {isMobile && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                      <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                        <p className="text-white text-sm font-medium">Use video controls to play</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details State */}
              {videoState === 'details' && (
                <div className="space-y-10">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                      {isMobile ? 'Tell Us About You' : 'Tell Us About Yourself'}
                    </h3>
                    <p className="text-gray-600 text-lg">Help employers find you with relevant details</p>
                  </div>
                  
                  <div className="max-w-3xl mx-auto space-y-8">
                    {/* Desired Roles */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                      <label className="block text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        Desired Roles <span className="text-gray-500 font-normal text-lg ml-2">(Max 7)</span>
                      </label>
                      <div className="flex space-x-4 mb-6">
                        <input
                          type="text"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          placeholder="e.g., Software Engineer, Product Manager"
                          className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white"
                          maxLength={50}
                          aria-label="Enter desired role"
                        />
                        <button
                          onClick={addRole}
                          disabled={!newRole.trim() || desiredRoles.length >= 7}
                          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl disabled:shadow-none disabled:opacity-50"
                          aria-label="Add role"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {desiredRoles.map((role, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 font-semibold border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {role}
                            <button
                              onClick={() => removeRole(index)}
                              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-200"
                              aria-label={`Remove ${role}`}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desired Location */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                      <label className="block text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Desired Location <span className="text-red-500 ml-2">*</span>
                      </label>
                      <input
                        type="text"
                        value={desiredLocation}
                        onChange={(e) => setDesiredLocation(e.target.value)}
                        placeholder="e.g., San Francisco, CA or Remote"
                        className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white"
                        maxLength={100}
                        aria-label="Enter desired location"
                      />
                    </div>

                    {/* Video Information */}
                    {recordedVideo && (
                      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                          <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Video Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 font-medium">Duration:</span>
                              <span className="font-bold text-gray-900">{videoDuration.toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 font-medium">File Size:</span>
                              <span className="font-bold text-gray-900">{(videoFileSize / (1024 * 1024)).toFixed(1)}MB</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-600 font-medium">Format:</span>
                              <span className="font-bold text-gray-900">{recordedVideo.type.split('/')[1].toUpperCase()}</span>
                            </div>
                          </div>
                          {videoThumbnail && (
                            <div className="flex justify-center">
                              <img 
                                src={videoThumbnail} 
                                alt="Video thumbnail" 
                                className="w-40 h-24 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center pt-6">
                      <button
                        onClick={saveChanges}
                        disabled={loading || !desiredRoles.length || !desiredLocation.trim()}
                        className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-5 rounded-2xl font-bold text-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-green-400 disabled:shadow-none disabled:opacity-50"
                        aria-label="Save changes"
                      >
                        <div className="flex items-center space-x-3">
                          {loading ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved State */}
              {videoState === 'saved' && (
                <div className="space-y-10">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">Your Introduction Video</h3>
                    <p className="text-gray-600 text-lg">Your video is ready to impress employers</p>
                  </div>
                  
                  <div className="w-full max-w-3xl mx-auto">
                    <div className="w-full h-[500px] bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                      <video
                        src={existingVideoUrl || ''}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <button
                      onClick={editVideo}
                      className={`group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-blue-400${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label="Edit video"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className={`w-5 h-5 group-hover:rotate-12 transition-transform${isMobile ? ' w-4 h-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{isMobile ? 'Edit Video' : 'Edit Video'}</span>
                      </div>
                    </button>
                    <button
                      onClick={editDetails}
                      className={`group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-purple-400${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label="Edit details"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className={`w-5 h-5 group-hover:scale-110 transition-transform${isMobile ? ' w-4 h-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{isMobile ? 'Edit Details' : 'Edit Details'}</span>
                      </div>
                    </button>
                  </div>

                  <div className="max-w-2xl mx-auto bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 border-2 border-gray-100 shadow-lg">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Current Details
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <span className="font-bold text-gray-700 text-lg">Desired Roles:</span>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {desiredRoles.map((role, index) => (
                            <span key={index} className="px-4 py-2 bg-white rounded-full text-base border-2 border-blue-200 shadow-sm font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-lg">Desired Location:</span>
                        <span className="ml-3 text-gray-900 text-lg">{desiredLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Video Lock Status Display */}
                  {videoLockStatus.isLocked && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-4 max-w-md">
                        <div className="flex items-center space-x-3">
                          <FiLock className="w-6 h-6 text-orange-600" />
                          <div>
                            <p className="text-orange-800 font-semibold text-sm">
                              Video Locked for Deletion
                            </p>
                            <p className="text-orange-700 text-xs">
                              {formatRemainingDays(videoLockStatus.remainingDays)} remaining
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      onClick={deleteVideo}
                      disabled={loading || videoLockStatus.isLocked}
                      className={`group px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed ${
                        videoLockStatus.isLocked 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-600 border-gray-300 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400'
                      } ${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label={videoLockStatus.isLocked ? "Video is locked and cannot be deleted" : "Delete video"}
                    >
                      <div className="flex items-center space-x-3">
                        {loading ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : videoLockStatus.isLocked ? (
                          <FiLock className="w-5 h-5" />
                        ) : (
                          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        <span>
                          {loading 
                            ? 'Deleting...' 
                            : videoLockStatus.isLocked 
                              ? `Locked (${formatRemainingDays(videoLockStatus.remainingDays)})`
                              : 'Delete Video'
                          }
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumes Tab */}
          {activeTab === 'resumes' && (
            <div className="space-y-10">
              {/* Initial State */}
              {resumeState === 'initial' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">Upload Your Resume</h3>
                    <p className="text-gray-600 text-lg max-w-md mx-auto">Upload your resume in PDF, DOC, or DOCX format. Maximum file size is 10MB.</p>
                  </div>
                  
                  {isMobile ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <label className="flex flex-col items-center cursor-pointer group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeFileChange}
                          className="hidden"
                          aria-label="Upload resume file"
                        />
                        <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1 rounded-full shadow-xl group-active:scale-95 transition-transform duration-150">
                          <div className="bg-white rounded-full p-8 flex items-center justify-center">
                            <FiUpload className="w-14 h-14 text-pink-500 group-hover:scale-110 transition-transform duration-200" />
                          </div>
                        </div>
                        <span className="mt-5 text-lg font-bold text-gray-900 tracking-tight">Upload Resume</span>
                        <span className="mt-2 text-sm text-gray-500 font-medium">PDF, DOC, DOCX up to 10MB</span>
                      </label>
                    </div>
                  ) : (
                    <div className="max-w-lg mx-auto">
                      <div className={`border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group-hover:scale-[1.02] shadow-lg hover:shadow-xl${isMobile ? ' p-6 text-base' : ''}`}>
                        <div className="space-y-6">
                          <div className={`w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 shadow-lg${isMobile ? ' w-14 h-14' : ''}`}>
                            <svg className={`w-12 h-12 text-blue-600${isMobile ? ' w-8 h-8' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div>
                            <p className={`text-2xl font-bold text-gray-900${isMobile ? ' text-lg' : ''}`}>Upload Resume</p>
                            <p className={`text-gray-600 mt-3 text-lg${isMobile ? ' text-sm mt-1' : ''}`}>Select a resume file from your device</p>
                            <p className={`text-gray-400 mt-2 text-base${isMobile ? ' text-xs mt-1' : ''}`}>PDF, DOC, or DOCX up to 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded State */}
              {resumeState === 'uploaded' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">Resume Uploaded</h3>
                    <p className="text-gray-600 text-lg">Your resume is ready to be saved</p>
                  </div>
                  
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8 text-center shadow-lg">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-green-800 font-bold text-lg">{resumeFile?.name}</p>
                      <p className="text-green-600 mt-2">File ready for upload</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-6">
                    <button
                      onClick={() => setResumeState('initial')}
                      className={`group bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-gray-400${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label="Change resume file"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-300${isMobile ? ' w-4 h-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{isMobile ? 'Change File' : 'Change File'}</span>
                      </div>
                    </button>
                    <button
                      onClick={saveChanges}
                      disabled={loading}
                      className={`group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-green-400${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label="Save resume"
                    >
                      <div className="flex items-center space-x-3">
                        {loading ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span>{loading ? 'Saving...' : 'Save Resume'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Saved State */}
              {resumeState === 'saved' && (
                <div className="space-y-10">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">Your Resume</h3>
                    <p className="text-gray-600 text-lg">Your resume is ready for employers</p>
                  </div>
                  
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-8 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">Resume</p>
                            <a
                              href={existingResumeUrl || ''}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-base font-semibold inline-flex items-center group"
                              aria-label="View resume in new tab"
                            >
                              View Resume 
                              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={deleteResume}
                          disabled={loading}
                          className={`text-red-600 hover:text-red-800 transition-colors p-3 rounded-xl hover:bg-red-50 border-2 border-transparent hover:border-red-200${isMobile ? ' px-3 py-2 text-sm' : ''}`}
                          aria-label="Delete resume"
                        >
                          {loading ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => setResumeState('initial')}
                      className={`group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-blue-400${isMobile ? ' px-6 py-3 text-sm' : ''}`}
                      aria-label="Upload new resume"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className={`w-5 h-5 group-hover:scale-110 transition-transform${isMobile ? ' w-4 h-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{isMobile ? 'Upload New Resume' : 'Upload New Resume'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Hidden canvas for thumbnail generation */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
          width="320"
          height="180"
        />
      </div>
    </div>
  );
};

export default UploadsModal;