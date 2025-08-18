import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { memoryStorageService } from '../services/memoryStorage';
import { isWebPlatform } from '../utils/platform';
import { Class, Student } from '../types/database';

const Dashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 공통 유틸 사용
        const isWeb = isWebPlatform();
        const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('Dashboard - 환경 감지:', { isWeb, hostname: window.location.hostname });
        
        const allClasses = await service.getClasses();
        setClasses(allClasses);
        setRecentClasses(allClasses.slice(0, 3));

        // 전체 학생 수 계산
        let total = 0;
        for (const cls of allClasses) {
          const students = await service.getStudentsByClass(cls.id);
          total += students.length;
        }
        setTotalStudents(total);
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        // 오류 발생 시 메모리 저장소 사용
        try {
          const allClasses = await memoryStorageService.getClasses();
          setClasses(allClasses);
          setRecentClasses(allClasses.slice(0, 3));

          let total = 0;
          for (const cls of allClasses) {
            const students = await memoryStorageService.getStudentsByClass(cls.id);
            total += students.length;
          }
          setTotalStudents(total);
        } catch (fallbackError) {
          console.error('폴백 데이터 로드도 실패:', fallbackError);
        }
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      name: '새 반 추가',
      description: '새로운 반을 생성합니다',
      href: '/classes',
      icon: PlusIcon,
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      name: '숙제 확인',
      description: '오늘 숙제를 확인합니다',
      href: '/homework',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-success-500 hover:bg-success-600'
    },
    {
      name: '통계 보기',
      description: '전체 통계를 확인합니다',
      href: '/statistics',
      icon: ChartBarIcon,
      color: 'bg-warning-500 hover:bg-warning-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">전체 현황을 한눈에 확인하고 빠르게 작업하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 반</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 학생</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘 날짜</p>
              <p className="text-2xl font-bold text-gray-900">{new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
                <action.icon className="h-8 w-8 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 최근 반 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">최근 반</h2>
          <Link
            to="/classes"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            전체 보기
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentClasses.map((cls) => (
            <Link
              key={cls.id}
              to={`/homework?class=${cls.id}`}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                </div>
                <AcademicCapIcon className="h-6 w-6 text-primary-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 환영 메시지 */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-primary-900 mb-2">숙제 관리자에 오신 것을 환영합니다!</h3>
          <p className="text-primary-700">
            빠르고 간단하게 학생들의 숙제를 관리하세요. 
            반과 학생을 추가하고, 매일 숙제 확인을 통해 학습 현황을 파악할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
