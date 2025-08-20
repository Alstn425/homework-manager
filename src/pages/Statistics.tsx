import React, { useEffect, useState } from 'react';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { memoryStorageService } from '../services/memoryStorage';
import { isWebPlatform } from '../utils/platform';
import { Class, Student } from '../types/database';

const Statistics: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | 'all' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (classes.length > 0) {
      loadMonthlyStats();
      loadStudentStats();
    }
  }, [selectedMonth, selectedClass]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('Statistics loadData - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const allClasses = await service.getClasses();
      const allStudents = (await Promise.all(
        allClasses.map(cls => service.getStudentsByClass(cls.id))
      )).flat();
      
      setClasses(allClasses);
      setStudents(allStudents);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const allClasses = await memoryStorageService.getClasses();
        const allStudents = (await Promise.all(
          allClasses.map(cls => memoryStorageService.getStudentsByClass(cls.id))
        )).flat();
        setClasses(allClasses);
        setStudents(allStudents);
      } catch (fallbackError) {
        console.error('폴백 데이터 로드도 실패:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      if (selectedClass === null) {
        setMonthlyStats([]);
        return;
      }
      const [year, month] = selectedMonth.split('-').map(Number);
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('Statistics loadMonthlyStats - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const stats = await service.getMonthlyStats(year, month);
      // 선택된 반에 따라 필터링
      const filteredStats = selectedClass === 'all'
        ? stats
        : stats.filter((stat: any) => stat.classId === selectedClass);
      setMonthlyStats(filteredStats);
    } catch (error) {
      console.error('월별 통계 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        if (selectedClass === null) { setMonthlyStats([]); return; }
        const stats = await memoryStorageService.getMonthlyStats(year, month);
        const filteredStats = selectedClass === 'all'
          ? stats
          : stats.filter((stat: any) => stat.classId === selectedClass);
        setMonthlyStats(filteredStats);
      } catch (fallbackError) {
        console.error('폴백 통계 로드도 실패:', fallbackError);
      }
    }
  };

  const loadStudentStats = async () => {
    try {
      if (selectedClass === null) {
        setStudentStats([]);
        return;
      }
      const [year, month] = selectedMonth.split('-').map(Number);
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('Statistics loadStudentStats - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const stats = await service.getStudentStats(year, month);
      
      // 선택된 반에 따라 필터링
      let filteredStats = stats;
      if (selectedClass !== 'all') {
        filteredStats = stats.filter(stat => {
          const student = students.find(s => s.id === stat.studentId);
          return student && student.classId === selectedClass;
        });
      }
      
      setStudentStats(filteredStats);
    } catch (error) {
      console.error('학생별 통계 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        if (selectedClass === null) { setStudentStats([]); return; }
        const stats = await memoryStorageService.getStudentStats(year, month);
        
        let filteredStats = stats;
        if (selectedClass !== 'all') {
          filteredStats = stats.filter(stat => {
            const student = students.find(s => s.id === stat.studentId);
            return student && student.classId === selectedClass;
          });
        }
        
        setStudentStats(filteredStats);
      } catch (fallbackError) {
        console.error('폴백 학생 통계 로드도 실패:', fallbackError);
      }
    }
  };

  const getCompletionRate = (stats: any) => {
    if (!stats || !stats.total) return 0;
    return Math.round((stats.done / stats.total) * 100);
  };


  const getTotalStats = () => {
    if (monthlyStats.length === 0) return null;
    
    return monthlyStats.reduce((total, stat) => ({
      total: total.total + stat.total,
      done: total.done + stat.done,
      partial: total.partial + stat.partial,
      notDone: total.notDone + stat.notDone,
      absent: total.absent + stat.absent
    }), {
      total: 0,
      done: 0,
      partial: 0,
      notDone: 0,
      absent: 0
    });
  };

  const getClassStudentCount = (classId: number) => {
    return students.filter(student => student.classId === classId).length;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-bold text-gray-900">통계</h1>
        <p className="mt-2 text-gray-600">반별, 학생별 숙제 수행률과 월별 통계를 확인하세요</p>
      </div>

      {/* 필터 */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              반 선택
            </label>
            <select
              value={selectedClass ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') return setSelectedClass(null);
                if (val === 'all') return setSelectedClass('all');
                const parsed = parseInt(val, 10);
                setSelectedClass(Number.isNaN(parsed) ? null : parsed);
              }}
              className="input-field"
            >
              <option value="" disabled>반 선택</option>
              <option value="all">전체 반</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              월 선택
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ChartBarIcon className="h-4 w-4 inline mr-1" />
              전체 현황
            </label>
            <div className="text-2xl font-bold text-primary-600">
              {totalStats ? getCompletionRate(totalStats) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 전체 통계 요약 */}
      {totalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료</p>
                <p className="text-2xl font-bold text-success-600">{totalStats.done}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">부분 완료</p>
                <p className="text-2xl font-bold text-warning-600">{totalStats.partial}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-danger-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">미완료</p>
                <p className="text-2xl font-bold text-danger-600">{totalStats.notDone}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <MinusIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">결석</p>
                <p className="text-2xl font-bold text-gray-600">{totalStats.absent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 반별 상세 통계 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">반별 상세 통계</h3>
        
        {monthlyStats.length === 0 ? (
          <div className="text-center py-8">
            <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">선택된 기간에 통계 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    반
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부분 완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    미완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결석
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyStats.map((stat: any) => (
                  <tr key={stat.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 text-primary-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{stat.className}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getClassStudentCount(stat.classId)}명
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${getCompletionRate(stat)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {getCompletionRate(stat)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-medium">
                      {stat.done}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warning-600 font-medium">
                      {stat.partial}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-600 font-medium">
                      {stat.notDone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {stat.absent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 학생별 상세 통계 */}
      <div className="card mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">학생별 상세 통계 (낮은 순)</h3>
        
        {studentStats.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">선택된 기간에 학생 통계 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    반
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부분 완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    미완료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결석
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentStats.map((stat) => (
                  <tr key={stat.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-primary-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{stat.studentName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.completionRate >= 80 ? 'bg-success-600' :
                              stat.completionRate >= 60 ? 'bg-warning-600' :
                              'bg-danger-600'
                            }`}
                            style={{ width: `${stat.completionRate}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          stat.completionRate >= 80 ? 'text-success-600' :
                          stat.completionRate >= 60 ? 'text-warning-600' :
                          'text-danger-600'
                        }`}>
                          {stat.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-medium">
                      {stat.done}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warning-600 font-medium">
                      {stat.partial}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-600 font-medium">
                      {stat.notDone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {stat.absent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 차트 영역 (향후 Recharts로 구현 예정) */}
      <div className="card mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">월별 추이 차트</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
            <p>차트 기능은 추후 업데이트 예정입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
