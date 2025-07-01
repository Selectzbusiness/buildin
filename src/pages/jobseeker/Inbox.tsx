import React from 'react';
import MessagingSystem from '../../components/MessagingSystem';

const Inbox: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <MessagingSystem currentRole="jobseeker" />
      </div>
    </div>
  );
};

export default Inbox; 