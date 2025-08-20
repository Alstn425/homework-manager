import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { memoryStorageService } from '../services/memoryStorage';
import { isWebPlatform } from '../utils/platform';
import { Class, Student, HomeworkRecord, HomeworkStatus, HOMEWORK_STATUS_OPTIONS } from '../types/database';

const HomeworkCheck: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  // 로컬 타임존 안전한 yyyy-mm-dd 생성
  const getTodayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [homeworkRecords, setHomeworkRecords] = useState<Map<number, HomeworkRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const evaluatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && students.length > 0) {
      loadHomeworkRecords();
    }
  }, [selectedClass, students, selectedDate]);

  // 학생 선택 시 평가 영역으로 스크롤
  useEffect(() => {
    if (evaluatorRef.current) {
      try {
        evaluatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        // 일부 WebView에서 smooth가 지원되지 않을 수 있음
        evaluatorRef.current.scrollIntoView();
      }
    }
  }, [currentStudentIndex]);

  // URL 파라미터에서 반 ID 가져오기
  useEffect(() => {
    const classId = searchParams.get('class');
    if (classId) {
      setSelectedClass(parseInt(classId));
    }
  }, [searchParams]);

  const loadClasses = async () => {
    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('loadClasses - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const allClasses = await service.getClasses();
      setClasses(allClasses);
      if (allClasses.length > 0 && !selectedClass) {
        setSelectedClass(allClasses[0].id);
      }
    } catch (error) {
      console.error('반 목록 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const allClasses = await memoryStorageService.getClasses();
        setClasses(allClasses);
        if (allClasses.length > 0 && !selectedClass) {
          setSelectedClass(allClasses[0].id);
        }
      } catch (fallbackError) {
        console.error('폴백 데이터 로드도 실패:', fallbackError);
      }
    }
  };

  const loadStudents = async (classId: number) => {
    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('loadStudents - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const classStudents = await service.getStudentsByClass(classId);
      setStudents(classStudents);
      setCurrentStudentIndex(0);
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const classStudents = await memoryStorageService.getStudentsByClass(classId);
        setStudents(classStudents);
        setCurrentStudentIndex(0);
      } catch (fallbackError) {
        console.error('폴백 데이터 로드도 실패:', fallbackError);
      }
    }
  };

  const loadHomeworkRecords = async () => {
    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('loadHomeworkRecords - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      // 서비스에 일괄 조회가 있으면 사용, 없으면 개별 조회
      const batchAvailable = typeof (service as any).getHomeworkRecordsByClassAndDate === 'function';
      if (batchAvailable && selectedClass) {
        const list: HomeworkRecord[] = await (service as any).getHomeworkRecordsByClassAndDate(selectedClass, selectedDate);
        const map = new Map<number, HomeworkRecord>();
        list.forEach(r => map.set(r.studentId, r));
        setHomeworkRecords(map);
      } else {
        const records = new Map<number, HomeworkRecord>();
        for (const student of students) {
          const record = await service.getHomeworkRecord(student.id, selectedDate);
          if (record) {
            records.set(student.id, record);
          }
        }
        setHomeworkRecords(records);
      }
    } catch (error) {
      console.error('숙제 기록 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const records = new Map<number, HomeworkRecord>();
        for (const student of students) {
          const record = await memoryStorageService.getHomeworkRecord(student.id, selectedDate);
          if (record) {
            records.set(student.id, record);
          }
        }
        setHomeworkRecords(records);
      } catch (fallbackError) {
        console.error('폴백 데이터 로드도 실패:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (studentId: number, status: HomeworkStatus) => {
    try {
      console.log('숙제 상태 변경 시작:', { studentId, status, date: selectedDate });
      
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      console.log('handleStatusChange - 환경 감지:', { isWeb, hostname: window.location.hostname });
      console.log('사용 중인 서비스:', isWeb ? 'memoryStorageService' : 'databaseService');
      
      const recordId = await service.saveHomeworkRecord({
        studentId,
        date: selectedDate,
        status,
        note: ''
      });
      
      console.log('저장된 레코드 ID:', recordId);

      // 저장된 레코드 정보 가져오기
      const savedRecord = await service.getHomeworkRecord(studentId, selectedDate);
      console.log('가져온 저장된 레코드:', savedRecord);
      
      if (savedRecord) {
        console.log('기존 레코드 업데이트:', savedRecord);
        setHomeworkRecords(prev => new Map(prev).set(studentId, savedRecord));
      } else {
        // 저장된 레코드를 가져올 수 없는 경우 새로 생성
        console.log('새 레코드 생성');
        const newRecord: HomeworkRecord = {
          id: recordId,
          studentId,
          date: selectedDate,
          status,
          note: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setHomeworkRecords(prev => new Map(prev).set(studentId, newRecord));
      }
      
      console.log('숙제 기록 상태 업데이트 완료');
      
      // 다음 학생으로 자동 이동
      if (currentStudentIndex < students.length - 1) {
        setCurrentStudentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('숙제 상태 저장 실패:', error);
      console.error('오류 상세 정보:', {
        message: error.message,
        stack: error.stack,
        studentId,
        status,
        date: selectedDate
      });
      alert('숙제 상태를 저장하는 중 오류가 발생했습니다.');
    }
  };

  const getStatusIcon = (status: HomeworkStatus) => {
    switch (status) {
      case 'done':
        return <CheckIcon className="h-5 w-5 text-success-600" />;
      case 'partial':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />;
      case 'not_done':
        return <XMarkIcon className="h-5 w-5 text-danger-600" />;
      case 'absent':
        return <MinusIcon className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: HomeworkStatus) => {
    const option = HOMEWORK_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.bgColor : 'bg-gray-100';
  };

  const getCurrentStudent = () => {
    return students[currentStudentIndex] || null;
  };

  const getStudentRecord = (studentId: number) => {
    return homeworkRecords.get(studentId);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-bold text-gray-900">숙제 확인</h1>
        <p className="mt-2 text-gray-600">학생들의 숙제 수행 여부를 빠르게 기록하세요</p>
      </div>

      {/* 컨트롤 */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AcademicCapIcon className="h-4 w-4 inline mr-1" />
              반 선택
            </label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(parseInt(e.target.value))}
              className="input-field"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              학생 수
            </label>
            <div className="text-2xl font-bold text-primary-600">
              {students.length}명
            </div>
          </div>
        </div>
      </div>

      {/* 현재 학생 숙제 확인 */}
      {getCurrentStudent() && (
        <div ref={evaluatorRef} className="card mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              {getCurrentStudent()?.name} 학생 숙제 확인
            </h2>
            <p className="text-primary-700 mb-6">
              {currentStudentIndex + 1} / {students.length} - {selectedDate}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOMEWORK_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(getCurrentStudent()!.id, option.value)}
                  className={`p-4 rounded-lg border-2 border-transparent hover:border-primary-300 transition-all duration-200 ${option.bgColor}`}
                >
                  <div className={`text-lg font-bold ${option.color} mb-2`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getStatusIcon(option.value)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 전체 학생 목록 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">전체 학생 숙제 현황</h3>
        
        {students.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">선택된 반에 학생이 없습니다.</p>
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
                    숙제 상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const record = getStudentRecord(student.id);
                  const status = record?.status || null;
                  
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => setCurrentStudentIndex(index)}
                      className={`cursor-pointer hover:bg-gray-50 ${index === currentStudentIndex ? 'bg-primary-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-primary-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.grade}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classes.find(c => c.id === student.classId)?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status ? (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="ml-1">
                              {HOMEWORK_STATUS_OPTIONS.find(opt => opt.value === status)?.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">미기록</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkCheck;
