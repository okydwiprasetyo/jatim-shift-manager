export type ShiftType = 'P' | 'S' | 'M' | 'OFF';

export interface Employee {
  id: string;
  name: string;
  position: string;
}

export interface DayShift {
  employeeId: string;
  shift: ShiftType;
}

export interface MonthSchedule {
  id?: string;
  month: number;
  year: number;
  schedule: Record<string, Record<number, ShiftType>>; // employeeId -> day -> shift
  createdAt?: Date;
  fairnessScore?: number;
}

export interface ShiftStatistics {
  employeeId: string;
  employeeName: string;
  totalHari: number;
  libur: number;
  masuk: number;
  pagi: number;
  sore: number;
  malam: number;
}

export interface GeneratorConfig {
  maxConsecutiveDays: number;
  minRestDays: number;
  weekendFairness: boolean;
}
