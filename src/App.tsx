import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { databaseService } from './services/database';
import { memoryStorageService } from './services/memoryStorage';
import { isWebPlatform } from './utils/platform';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ClassManagement from './pages/ClassManagement';
import StudentManagement from './pages/StudentManagement';
import HomeworkCheck from './pages/HomeworkCheck';
import Statistics from './pages/Statistics';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        // 공통 유틸로 웹 환경 확인
        const isWeb = isWebPlatform();
        
        if (isWeb) {
          // 웹 환경에서는 메모리 저장소 사용
          console.log('웹 환경에서 메모리 저장소를 사용합니다.');
          setIsInitialized(true);
        } else {
          // 모바일 환경에서는 SQLite 사용
          await databaseService.initialize();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('앱 초기화 실패:', error);
        // 오류 발생 시 메모리 저장소로 폴백
        console.log('메모리 저장소로 폴백합니다.');
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">앱 초기화 실패</h1>
          <p className="text-gray-600">데이터베이스를 초기화할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="pt-16 pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/homework" element={<HomeworkCheck />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
