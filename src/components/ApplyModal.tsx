import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../config/supabase';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resumeUrl: string | null, videoUrl: string | null) => Promise<void>;
  loading: boolean;
  resumeRequired: boolean;
  videoRequired: boolean;
  existingResumeUrl?: string | null;
  existingVideoUrl?: string | null;
}

const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  resumeRequired,
  videoRequired,
  existingResumeUrl,
  existingVideoUrl,
}) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(existingResumeUrl || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setResumeUrl(null);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoUrl(null);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage.from('uploads').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { publicUrl } = supabase.storage.from('uploads').getPublicUrl(fileName).data;
    return publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);
    setUploading(true);
    try {
      let finalResumeUrl = resumeUrl;
      let finalVideoUrl = videoUrl;
      if (resumeFile) {
        finalResumeUrl = await uploadFile(resumeFile, 'resumes');
        setResumeUrl(finalResumeUrl);
      }
      if (videoFile) {
        finalVideoUrl = await uploadFile(videoFile, 'videos');
        setVideoUrl(finalVideoUrl);
      }
      if (resumeRequired && !finalResumeUrl) {
        setError('Resume is required.');
        setUploading(false);
        return;
      }
      if (videoRequired && !finalVideoUrl) {
        setError('Video is required.');
        setUploading(false);
        return;
      }
      await onSubmit(finalResumeUrl, finalVideoUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for this position"
      actions={
        <>
          <button className="px-4 py-2 bg-gray-200 rounded-lg font-semibold mr-2" onClick={onClose} disabled={uploading || loading}>Cancel</button>
          <button className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold" onClick={handleSubmit} disabled={uploading || loading}>{uploading || loading ? 'Submitting...' : 'Submit Application'}</button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div>
          <label className="block font-semibold mb-1">Resume {resumeRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400">(optional)</span>}</label>
          {resumeUrl && <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline mb-1">View Current Resume</a>}
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} disabled={uploading || loading} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Video {videoRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400">(optional)</span>}</label>
          {videoUrl && <video src={videoUrl} controls className="w-full max-w-xs mb-1" />}
          <input type="file" accept="video/*" onChange={handleVideoChange} disabled={uploading || loading} />
        </div>
      </div>
    </Modal>
  );
};

export default ApplyModal; 