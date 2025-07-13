import React from 'react';
import { FiShield } from 'react-icons/fi';

interface VideoVerifiedTagProps {
  className?: string;
  iconSize?: number;
}

const VideoVerifiedTag: React.FC<VideoVerifiedTagProps> = ({ className = '', iconSize = 18 }) => (
  <span className={`inline-flex items-center rounded-full bg-white border border-gray-300 shadow px-3 py-1 text-xs font-semibold text-gray-800 ${className}`}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="mr-1"
      style={{ width: iconSize, height: iconSize }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7.5 4.5v6.75c0 4.28-3.11 8.18-7.5 9-4.39-.82-7.5-4.72-7.5-9V7.5L12 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 12.75l1.5 1.5 3-3"
      />
    </svg>
    Video verified
  </span>
);

export default VideoVerifiedTag; 