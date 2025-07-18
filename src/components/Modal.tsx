import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred, dark overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px] transition-all duration-300" onClick={onClose} />
      {/* Modal card (children) */}
      <div
        className="relative bg-gradient-to-br from-[#185a9d]/90 via-[#43cea2]/80 to-[#185a9d]/90 rounded-3xl shadow-2xl w-full p-10 animate-fadeInScaleUp sm:rounded-2xl sm:p-5 flex flex-col justify-center overflow-hidden backdrop-blur-xl bg-opacity-80 border border-white/40"
        style={{ minWidth: '320px', maxWidth: '420px', minHeight: '480px', maxHeight: '90vh', boxShadow: '0 8px 40px 0 rgba(24,90,157,0.18), 0 1.5px 8px 0 rgba(67,206,162,0.10)', backdropFilter: 'blur(12px)', position: 'relative' }}
      >
        {/* Close button at top right corner */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-3 sm:right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition shadow-sm border border-gray-200 z-20"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Decorative animated accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-tr from-[#43cea2]/60 to-[#185a9d]/40 rounded-full blur-2xl animate-spin-slow z-0 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-bl from-[#185a9d]/50 to-[#43cea2]/30 rounded-full blur-2xl animate-float z-0 pointer-events-none" />
        {/* Animated wave at bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-16 z-0 animate-wave pointer-events-none" viewBox="0 0 420 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 32C70 64 140 0 210 32C280 64 350 0 420 32V64H0V32Z" fill="url(#modalWaveGradient)" fillOpacity="0.18"/>
          <defs>
            <linearGradient id="modalWaveGradient" x1="0" y1="0" x2="420" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#185a9d"/>
              <stop offset="0.5" stopColor="#43cea2"/>
              <stop offset="1" stopColor="#185a9d"/>
            </linearGradient>
          </defs>
        </svg>
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  ) : null;
};

export default Modal; 