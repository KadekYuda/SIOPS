import React from 'react';

const CosForm = ({ title, onSubmit, children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
      <div className="bg-gradient-to-r from-blue-400 to-green-600 rounded-lg mt-20  ">
        <div className="w-full p-8">
          <h2 className="text-center text-2xl font-bold text-white">{title}</h2>
          <form className="mt-6" onSubmit={onSubmit}>
            {children}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CosForm;
