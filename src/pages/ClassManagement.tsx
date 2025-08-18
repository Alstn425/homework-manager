import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { databaseService } from '../services/database';
import { memoryStorageService } from '../services/memoryStorage';
import { isWebPlatform } from '../utils/platform';
import { Class } from '../types/database';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('ClassManagement loadClasses - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      const allClasses = await service.getClasses();
      setClasses(allClasses);
    } catch (error) {
      console.error('반 목록 로드 실패:', error);
      // 오류 발생 시 메모리 저장소 사용
      try {
        const allClasses = await memoryStorageService.getClasses();
        setClasses(allClasses);
      } catch (fallbackError) {
        console.error('폴백 데이터 로드도 실패:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ name: cls.name, description: cls.description || '' });
    } else {
      setEditingClass(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('반 이름을 입력해주세요.');
      return;
    }

    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('ClassManagement handleSubmit - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      if (editingClass) {
        await service.updateClass(editingClass.id, formData.name, formData.description);
      } else {
        await service.createClass(formData.name, formData.description);
      }
      
      closeModal();
      loadClasses();
    } catch (error) {
      console.error('반 저장 실패:', error);
      alert('반을 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 반을 삭제하시겠습니까? 모든 학생과 숙제 기록이 함께 삭제됩니다.')) {
      return;
    }

    try {
      // 공통 유틸 사용
      const isWeb = isWebPlatform();
      const service = isWeb ? memoryStorageService : databaseService;
      
      console.log('ClassManagement handleDelete - 환경 감지:', { isWeb, hostname: window.location.hostname });
      
      await service.deleteClass(id);
      loadClasses();
    } catch (error) {
      console.error('반 삭제 실패:', error);
      alert('반을 삭제하는 중 오류가 발생했습니다.');
    }
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
            <h1 className="text-3xl font-bold text-gray-900">반 관리</h1>
            <p className="mt-2 text-gray-600">반을 추가, 수정, 삭제할 수 있습니다</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 반 추가
          </button>
        </div>
      </div>

      {/* 반 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <AcademicCapIcon className="h-6 w-6 text-primary-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
                </div>
                {cls.description && (
                  <p className="text-gray-600 text-sm mb-3">{cls.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  생성일: {new Date(cls.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => openModal(cls)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 반이 없습니다</h3>
          <p className="text-gray-600 mb-4">첫 번째 반을 추가해보세요!</p>
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            반 추가하기
          </button>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingClass ? '반 수정' : '새 반 추가'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    반 이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="예: 수학 A반"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="반에 대한 설명을 입력하세요"
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
                    {editingClass ? '수정' : '추가'}
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

export default ClassManagement;
