import React from "react";

const LoadingComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingComponent;
