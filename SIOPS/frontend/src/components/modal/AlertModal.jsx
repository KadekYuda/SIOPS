import React from 'react';
import { CircleX } from 'lucide-react';

const AlertModal = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <CircleX className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-4">
            {message}
          </h3>
          <button
            onClick={onClose}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
