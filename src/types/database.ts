export interface Class {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  classId: number;
  name: string;
  grade?: string;
  phone?: string;
  parentPhone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkRecord {
  id: number;
  studentId: number;
  date: string;
  status: HomeworkStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type HomeworkStatus = 'done' | 'partial' | 'not_done' | 'absent';

export interface HomeworkStatusOption {
  value: HomeworkStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const HOMEWORK_STATUS_OPTIONS: HomeworkStatusOption[] = [
  {
    value: 'done',
    label: '함',
    color: 'text-success-700',
    bgColor: 'bg-success-100'
  },
  {
    value: 'partial',
    label: '덜 함',
    color: 'text-warning-700',
    bgColor: 'bg-warning-100'
  },
  {
    value: 'not_done',
    label: '안 함',
    color: 'text-danger-700',
    bgColor: 'bg-danger-100'
  },
  {
    value: 'absent',
    label: '결석',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  }
];

export interface Statistics {
  totalStudents: number;
  totalClasses: number;
  monthlyStats: MonthlyStats[];
  classStats: ClassStats[];
}

export interface MonthlyStats {
  month: string;
  totalRecords: number;
  doneCount: number;
  partialCount: number;
  notDoneCount: number;
  absentCount: number;
  completionRate: number;
}

export interface ClassStats {
  classId: number;
  className: string;
  studentCount: number;
  completionRate: number;
  monthlyTrend: number;
}
