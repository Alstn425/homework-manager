import { Class, Student, HomeworkRecord, HomeworkStatus } from '../types/database';

class MemoryStorageService {
  private classes: Map<number, Class> = new Map();
  private students: Map<number, Student> = new Map();
  private homeworkRecords: Map<number, HomeworkRecord> = new Map();
  private nextClassId = 1;
  private nextStudentId = 1;
  private nextRecordId = 1;
  private static STORAGE_KEY = 'hm_manager_memory_storage_v1';

  constructor() {
    const loaded = this.loadFromStorage();
    if (!loaded) {
      this.insertSampleData();
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const snapshot = {
        classes: Array.from(this.classes.values()),
        students: Array.from(this.students.values()),
        homeworkRecords: Array.from(this.homeworkRecords.values()),
        nextClassId: this.nextClassId,
        nextStudentId: this.nextStudentId,
        nextRecordId: this.nextRecordId,
      };
      window.localStorage.setItem(MemoryStorageService.STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.error('메모리 저장소 저장 오류:', error);
    }
  }

  private loadFromStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = window.localStorage.getItem(MemoryStorageService.STORAGE_KEY);
      if (!raw) return false;
      const snapshot = JSON.parse(raw) as {
        classes: Class[];
        students: Student[];
        homeworkRecords: HomeworkRecord[];
        nextClassId: number;
        nextStudentId: number;
        nextRecordId: number;
      };
      this.classes = new Map(snapshot.classes.map(c => [c.id, c]));
      this.students = new Map(snapshot.students.map(s => [s.id, s]));
      this.homeworkRecords = new Map(snapshot.homeworkRecords.map(r => [r.id, r]));
      this.nextClassId = snapshot.nextClassId || 1;
      this.nextStudentId = snapshot.nextStudentId || 1;
      this.nextRecordId = snapshot.nextRecordId || 1;
      return true;
    } catch (error) {
      console.error('메모리 저장소 로드 오류:', error);
      return false;
    }
  }

  private insertSampleData() {
    // 샘플 반 데이터 (1개만)
    const sampleClasses = [
      { id: 1, name: '수학 A반', description: '중학교 1학년 수학', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];

    sampleClasses.forEach(cls => {
      this.classes.set(cls.id, cls);
      this.nextClassId = Math.max(this.nextClassId, cls.id + 1);
    });

    // 샘플 학생 데이터 (1명만)
    const sampleStudents = [
      { id: 1, classId: 1, name: '김철수', grade: '중1', phone: '010-1234-5678', parentPhone: '010-8765-4321', note: '수학에 관심이 많음', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];

    sampleStudents.forEach(student => {
      this.students.set(student.id, student);
      this.nextStudentId = Math.max(this.nextStudentId, student.id + 1);
    });

    // 샘플 숙제 기록 데이터 (최근 30일, 김철수만)
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const statuses: HomeworkStatus[] = ['done', 'partial', 'not_done', 'absent'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const record: HomeworkRecord = {
        id: this.nextRecordId++,
        studentId: 1,
        date: dateStr,
        status: randomStatus,
        note: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.homeworkRecords.set(record.id, record);
    }
  }

  // 반 관련 메서드
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(name: string, description?: string): Promise<number> {
    const newClass: Class = {
      id: this.nextClassId++,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.classes.set(newClass.id, newClass);
    this.saveToStorage();
    return newClass.id;
  }

  async updateClass(id: number, name: string, description?: string): Promise<void> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      throw new Error('반을 찾을 수 없습니다.');
    }

    existingClass.name = name;
    existingClass.description = description || '';
    existingClass.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  async deleteClass(id: number): Promise<void> {
    // 해당 반의 학생들도 삭제
    const studentsToDelete = Array.from(this.students.values()).filter(s => s.classId === id);
    studentsToDelete.forEach(s => this.students.delete(s.id));
    
    // 해당 반의 숙제 기록도 삭제
    const recordsToDelete = Array.from(this.homeworkRecords.values()).filter(r => 
      studentsToDelete.some(s => s.id === r.studentId)
    );
    recordsToDelete.forEach(r => this.homeworkRecords.delete(r.id));
    
    this.classes.delete(id);
    this.saveToStorage();
  }

  // 학생 관련 메서드
  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.classId === classId);
  }

  async createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const newStudent: Student = {
      ...student,
      id: this.nextStudentId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.students.set(newStudent.id, newStudent);
    this.saveToStorage();
    return newStudent.id;
  }

  async updateStudent(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<void> {
    const existingStudent = this.students.get(student.id);
    if (!existingStudent) {
      throw new Error('학생을 찾을 수 없습니다.');
    }

    existingStudent.name = student.name;
    existingStudent.classId = student.classId;
    existingStudent.grade = student.grade;
    existingStudent.phone = student.phone;
    existingStudent.parentPhone = student.parentPhone;
    existingStudent.note = student.note;
    existingStudent.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  async deleteStudent(id: number): Promise<void> {
    // 해당 학생의 숙제 기록도 삭제
    const recordsToDelete = Array.from(this.homeworkRecords.values()).filter(r => r.studentId === id);
    recordsToDelete.forEach(r => this.homeworkRecords.delete(r.id));
    
    this.students.delete(id);
    this.saveToStorage();
  }

  // 숙제 기록 관련 메서드
  async getHomeworkRecords(studentId: number, startDate?: string, endDate?: string): Promise<HomeworkRecord[]> {
    let records = Array.from(this.homeworkRecords.values()).filter(r => r.studentId === studentId);
    
    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }
    
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveHomeworkRecord(record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      // 기존 기록이 있는지 확인
      const existingRecord = Array.from(this.homeworkRecords.values()).find(
        r => r.studentId === record.studentId && r.date === record.date
      );

      if (existingRecord) {
        // 기존 기록 업데이트
        existingRecord.status = record.status;
        existingRecord.note = record.note;
        existingRecord.updatedAt = new Date().toISOString();
        console.log('기존 숙제 기록 업데이트:', existingRecord);
        this.saveToStorage();
        return existingRecord.id;
      } else {
        // 새 기록 생성
        const newRecord: HomeworkRecord = {
          ...record,
          id: this.nextRecordId++,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.homeworkRecords.set(newRecord.id, newRecord);
        console.log('새 숙제 기록 생성:', newRecord);
        this.saveToStorage();
        return newRecord.id;
      }
    } catch (error) {
      console.error('saveHomeworkRecord 오류:', error);
      throw error;
    }
  }

  async getHomeworkRecord(studentId: number, date: string): Promise<HomeworkRecord | null> {
    try {
      const record = Array.from(this.homeworkRecords.values()).find(
        r => r.studentId === studentId && r.date === date
      );
      console.log('getHomeworkRecord 호출:', { studentId, date, found: !!record, record });
      return record || null;
    } catch (error) {
      console.error('getHomeworkRecord 오류:', error);
      throw error;
    }
  }

  // 통계 관련 메서드
  async getMonthlyStats(year: number, month: number): Promise<any[]> {
    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;
    
    const records = Array.from(this.homeworkRecords.values()).filter(
      r => r.date >= startDate && r.date <= endDate
    );

    const stats = new Map<number, { classId: number, className: string, total: number, done: number, partial: number, notDone: number, absent: number }>();

    records.forEach(record => {
      const student = this.students.get(record.studentId);
      if (student) {
        const classInfo = this.classes.get(student.classId);
        if (classInfo) {
          const key = student.classId;
          if (!stats.has(key)) {
            stats.set(key, {
              classId: student.classId,
              className: classInfo.name,
              total: 0,
              done: 0,
              partial: 0,
              notDone: 0,
              absent: 0
            });
          }
          
          const stat = stats.get(key)!;
          stat.total++;
          
          switch (record.status) {
            case 'done':
              stat.done++;
              break;
            case 'partial':
              stat.partial++;
              break;
            case 'not_done':
              stat.notDone++;
              break;
            case 'absent':
              stat.absent++;
              break;
          }
        }
      }
    });

    return Array.from(stats.values());
  }

  // 학생별 통계
  async getStudentStats(year: number, month: number): Promise<any[]> {
    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;
    
    const records = Array.from(this.homeworkRecords.values()).filter(
      r => r.date >= startDate && r.date <= endDate
    );

    const studentStats = new Map<number, { 
      studentId: number, 
      studentName: string, 
      className: string, 
      total: number, 
      done: number, 
      partial: number, 
      notDone: number, 
      absent: number,
      completionRate: number 
    }>();

    records.forEach(record => {
      const student = this.students.get(record.studentId);
      if (student) {
        const classInfo = this.classes.get(student.classId);
        if (classInfo) {
          const key = student.id;
          if (!studentStats.has(key)) {
            studentStats.set(key, {
              studentId: student.id,
              studentName: student.name,
              className: classInfo.name,
              total: 0,
              done: 0,
              partial: 0,
              notDone: 0,
              absent: 0,
              completionRate: 0
            });
          }
          
          const stat = studentStats.get(key)!;
          stat.total++;
          
          switch (record.status) {
            case 'done':
              stat.done++;
              break;
            case 'partial':
              stat.partial++;
              break;
            case 'not_done':
              stat.notDone++;
              break;
            case 'absent':
              stat.absent++;
              break;
          }
        }
      }
    });

    // 완성률 계산
    studentStats.forEach(stat => {
      const completed = stat.done + (stat.partial * 0.5); // 부분 완성은 0.5로 계산
      stat.completionRate = stat.total > 0 ? Math.round((completed / stat.total) * 100) : 0;
    });

    return Array.from(studentStats.values()).sort((a, b) => a.completionRate - b.completionRate); // 낮은 순으로 정렬
  }

  // 특정 반과 날짜에 대한 숙제 기록 일괄 조회 (성능 개선용)
  async getHomeworkRecordsByClassAndDate(classId: number, date: string): Promise<HomeworkRecord[]> {
    const studentsInClass = Array.from(this.students.values()).filter(s => s.classId === classId).map(s => s.id);
    return Array.from(this.homeworkRecords.values())
      .filter(r => r.date === date && studentsInClass.includes(r.studentId))
      .sort((a, b) => a.studentId - b.studentId);
  }

  async close(): Promise<void> {
    // 메모리 저장소는 별도 정리 작업이 필요 없음
  }
}

export const memoryStorageService = new MemoryStorageService();
