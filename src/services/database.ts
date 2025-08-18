import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Class, Student, HomeworkRecord, HomeworkStatus } from '../types/database';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'homework_manager.db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    try {
      // 데이터베이스 생성
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false
      );

      if (this.db) {
        await this.db.open();
        await this.createTables();
        console.log('데이터베이스 초기화 완료');
      }
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // 반 테이블
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 학생 테이블
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        grade TEXT,
        phone TEXT,
        parent_phone TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
      )
    `);

    // 숙제 기록 테이블
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS homework_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        UNIQUE(student_id, date)
      )
    `);

    // 샘플 데이터 추가
    await this.insertSampleData();
  }

  private async insertSampleData(): Promise<void> {
    if (!this.db) return;

    // 샘플 반 추가
    const classResult = await this.db.query(
      'SELECT COUNT(*) as count FROM classes'
    );
    
    if (classResult.values && classResult.values[0].count === 0) {
      await this.db.execute(`
        INSERT INTO classes (name, description) VALUES 
        ('수학 A반', '중학교 1학년 수학'),
        ('영어 B반', '고등학교 2학년 영어')
      `);

      // 샘플 학생 추가
      await this.db.execute(`
        INSERT INTO students (class_id, name, grade, phone) VALUES 
        (1, '김철수', '중1', '010-1234-5678'),
        (1, '이영희', '중1', '010-2345-6789'),
        (2, '박민수', '고2', '010-3456-7890'),
        (2, '정수진', '고2', '010-4567-8901')
      `);
    }
  }

  // 반 관련 메서드
  async getClasses(): Promise<Class[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.query('SELECT * FROM classes ORDER BY name');
    return result.values?.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  }

  async createClass(name: string, description?: string): Promise<number> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.run(
      'INSERT INTO classes (name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.lastId || 0;
  }

  async updateClass(id: number, name: string, description?: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    await this.db.run(
      'UPDATE classes SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, id]
    );
  }

  async deleteClass(id: number): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    await this.db.run('DELETE FROM classes WHERE id = ?', [id]);
  }

  // 학생 관련 메서드
  async getStudentsByClass(classId: number): Promise<Student[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.query(
      'SELECT * FROM students WHERE class_id = ? ORDER BY name',
      [classId]
    );
    return result.values?.map(row => ({
      id: row.id,
      classId: row.class_id,
      name: row.name,
      grade: row.grade,
      phone: row.phone,
      parentPhone: row.parent_phone,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  }

  async createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.run(
      'INSERT INTO students (class_id, name, grade, phone, parent_phone, note) VALUES (?, ?, ?, ?, ?, ?)',
      [student.classId, student.name, student.grade, student.phone, student.parentPhone, student.note]
    );
    return result.lastId || 0;
  }

  async updateStudent(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    await this.db.run(
      'UPDATE students SET class_id = ?, name = ?, grade = ?, phone = ?, parent_phone = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [student.classId, student.name, student.grade, student.phone, student.parentPhone, student.note, student.id]
    );
  }

  async deleteStudent(id: number): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    await this.db.run('DELETE FROM students WHERE id = ?', [id]);
  }

  // 숙제 기록 관련 메서드
  async getHomeworkRecords(studentId: number, startDate?: string, endDate?: string): Promise<HomeworkRecord[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    let query = 'SELECT * FROM homework_records WHERE student_id = ?';
    const params: any[] = [studentId];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await this.db.query(query, params);
    return result.values?.map(row => ({
      id: row.id,
      studentId: row.student_id,
      date: row.date,
      status: row.status as HomeworkStatus,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  }

  async saveHomeworkRecord(record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.run(
      'INSERT OR REPLACE INTO homework_records (student_id, date, status, note) VALUES (?, ?, ?, ?)',
      [record.studentId, record.date, record.status, record.note]
    );
    return result.lastId || 0;
  }

  async getHomeworkRecord(studentId: number, date: string): Promise<HomeworkRecord | null> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const result = await this.db.query(
      'SELECT * FROM homework_records WHERE student_id = ? AND date = ?',
      [studentId, date]
    );
    
    if (result.values && result.values.length > 0) {
      const row = result.values[0];
      return {
        id: row.id,
        studentId: row.student_id,
        date: row.date,
        status: row.status as HomeworkStatus,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
    
    return null;
  }

  // 통계 관련 메서드
  async getMonthlyStats(year: number, month: number): Promise<any[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const result = await this.db.query(`
      SELECT 
        s.class_id,
        c.name as class_name,
        COUNT(*) as total_records,
        SUM(CASE WHEN hr.status = 'done' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN hr.status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN hr.status = 'not_done' THEN 1 ELSE 0 END) as not_done_count,
        SUM(CASE WHEN hr.status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN homework_records hr ON s.id = hr.student_id AND hr.date BETWEEN ? AND ?
      GROUP BY s.class_id, c.name
    `, [startDate, endDate]);
    
    return result.values || [];
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.DB_NAME);
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
