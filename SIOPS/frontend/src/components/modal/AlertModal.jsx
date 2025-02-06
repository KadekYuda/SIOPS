import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <h3 className="text-lg font-semibold text-center mb-4">Alert</h3>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
