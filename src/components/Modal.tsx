import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {title && <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>}
        <div className="mb-4">{children}</div>
        {actions && <div className="flex justify-end space-x-3">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal; 