import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <div className="animate-bounce mb-6">
          <AcademicCapIcon className="h-20 w-20 text-primary-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-primary-900 mb-4">숙제 관리자</h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-primary-700 mt-4">앱을 초기화하고 있습니다...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
