import { ShiftType, ShiftStatistics, MonthSchedule, Employee } from "@/types/shift";

export const getShiftColor = (shift: ShiftType): string => {
  switch (shift) {
    case 'P': return 'bg-shift-pagi text-shift-pagi-foreground';
    case 'S': return 'bg-shift-sore text-shift-sore-foreground';
    case 'M': return 'bg-shift-malam text-shift-malam-foreground';
    case 'OFF': return 'bg-shift-off text-shift-off-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getShiftLabel = (shift: ShiftType): string => {
  switch (shift) {
    case 'P': return 'Pagi';
    case 'S': return 'Sore';
    case 'M': return 'Malam';
    case 'OFF': return 'Libur';
    default: return '';
  }
};

export const calculateStatistics = (
  schedule: MonthSchedule,
  employees: Employee[]
): ShiftStatistics[] => {
  return employees.map(emp => {
    const empSchedule = schedule.schedule[emp.id] || {};
    const days = Object.values(empSchedule);
    
    const stats: ShiftStatistics = {
      employeeId: emp.id,
      employeeName: emp.name,
      totalHari: days.length,
      libur: days.filter(s => s === 'OFF').length,
      masuk: days.filter(s => s !== 'OFF').length,
      pagi: days.filter(s => s === 'P').length,
      sore: days.filter(s => s === 'S').length,
      malam: days.filter(s => s === 'M').length,
    };
    
    return stats;
  });
};

export const calculateFairnessScore = (statistics: ShiftStatistics[]): number => {
  if (statistics.length === 0) return 0;
  
  const avgLibur = statistics.reduce((sum, s) => sum + s.libur, 0) / statistics.length;
  const avgPagi = statistics.reduce((sum, s) => sum + s.pagi, 0) / statistics.length;
  const avgSore = statistics.reduce((sum, s) => sum + s.sore, 0) / statistics.length;
  const avgMalam = statistics.reduce((sum, s) => sum + s.malam, 0) / statistics.length;
  
  let deviationSum = 0;
  statistics.forEach(s => {
    deviationSum += Math.abs(s.libur - avgLibur);
    deviationSum += Math.abs(s.pagi - avgPagi);
    deviationSum += Math.abs(s.sore - avgSore);
    deviationSum += Math.abs(s.malam - avgMalam);
  });
  
  const maxDeviation = statistics.length * 4 * 10; // Max possible deviation
  const fairness = 1 - (deviationSum / maxDeviation);
  
  return Math.max(0, Math.min(1, fairness));
};

export const getFairnessColor = (score: number): string => {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.75) return 'text-yellow-600';
  return 'text-red-600';
};

export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

export const getMonthName = (month: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || '';
};
