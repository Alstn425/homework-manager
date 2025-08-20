import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { memoryStorageService } from '../services/memoryStorage';
import { isWebPlatform } from '../utils/platform';
import { Class, Student } from '../types/database';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    grade: '',
    phone: '',
    parentPhone: '',
    note: ''
  });
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('StudentManagement loadData - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
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

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        classId: student.classId.toString(),
        grade: student.grade || '',
        phone: student.phone || '',
        parentPhone: student.parentPhone || '',
        note: student.note || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        classId: classes.length > 0 ? classes[0].id.toString() : '',
        grade: '',
        phone: '',
        parentPhone: '',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      classId: '',
      grade: '',
      phone: '',
      parentPhone: '',
      note: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.classId) {
      alert('이름과 반을 입력해주세요.');
      return;
    }

    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('StudentManagement handleSubmit - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      if (editingStudent) {
        await service.updateStudent({
          ...editingStudent,
          name: formData.name,
          classId: parseInt(formData.classId),
          grade: formData.grade,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          note: formData.note
        });
      } else {
        await service.createStudent({
          name: formData.name,
          classId: parseInt(formData.classId),
          grade: formData.grade,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          note: formData.note
        });
      }
      
      closeModal();
      loadData();
    } catch (error) {
      console.error('학생 저장 실패:', error);
      alert('학생을 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 학생을 삭제하시겠습니까? 모든 숙제 기록이 함께 삭제됩니다.')) {
      return;
    }

    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('StudentManagement handleDelete - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      await service.deleteStudent(id);
      loadData();
    } catch (error) {
      console.error('학생 삭제 실패:', error);
      alert('학생을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(student => student.classId === selectedClass);

  const getClassName = (classId: number) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : '알 수 없음';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
            <p className="mt-2 text-gray-600">학생을 추가, 수정, 삭제할 수 있습니다</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 학생 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="input-field w-auto"
          >
            <option value="all">전체 반</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 학생 목록 */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                반
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                학년
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                비고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-primary-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getClassName(student.classId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.grade || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{student.phone || '-'}</div>
                    {student.parentPhone && (
                      <div className="text-xs text-gray-500">보호자: {student.parentPhone}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.note || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(student)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">학생이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            {selectedClass === 'all' ? '아직 등록된 학생이 없습니다.' : '이 반에는 등록된 학생이 없습니다.'}
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            학생 추가하기
          </button>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStudent ? '학생 수정' : '새 학생 추가'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="학생 이름"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                    반 *
                  </label>
                  <select
                    id="classId"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">반을 선택하세요</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    학년
                  </label>
                  <input
                    type="text"
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="input-field"
                    placeholder="예: 중1, 고2"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    연락처
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="010-0000-0000"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    보호자 연락처
                  </label>
                  <input
                    type="tel"
                    id="parentPhone"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="input-field"
                    placeholder="010-0000-0000"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                    비고
                  </label>
                  <textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="특이사항이나 메모"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingStudent ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
