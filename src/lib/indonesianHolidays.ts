// Daftar hari libur nasional Indonesia 2024-2026
// Diperbarui sesuai kalender resmi pemerintah

export interface Holiday {
  date: string; // format: YYYY-MM-DD
  name: string;
}

export const indonesianHolidays: Holiday[] = [
  // 2024
  { date: '2024-01-01', name: 'Tahun Baru Masehi' },
  { date: '2024-02-08', name: 'Tahun Baru Imlek' },
  { date: '2024-02-09', name: 'Cuti Bersama Imlek' },
  { date: '2024-03-11', name: 'Isra Miraj' },
  { date: '2024-03-12', name: 'Cuti Bersama' },
  { date: '2024-03-28', name: 'Hari Suci Nyepi' },
  { date: '2024-03-29', name: 'Wafat Isa Almasih' },
  { date: '2024-04-08', name: 'Cuti Bersama Idul Fitri' },
  { date: '2024-04-09', name: 'Cuti Bersama Idul Fitri' },
  { date: '2024-04-10', name: 'Hari Raya Idul Fitri' },
  { date: '2024-04-11', name: 'Hari Raya Idul Fitri' },
  { date: '2024-04-12', name: 'Cuti Bersama Idul Fitri' },
  { date: '2024-04-15', name: 'Cuti Bersama Idul Fitri' },
  { date: '2024-05-01', name: 'Hari Buruh' },
  { date: '2024-05-09', name: 'Kenaikan Isa Almasih' },
  { date: '2024-05-10', name: 'Cuti Bersama' },
  { date: '2024-05-23', name: 'Hari Raya Waisak' },
  { date: '2024-05-24', name: 'Cuti Bersama' },
  { date: '2024-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2024-06-17', name: 'Hari Raya Idul Adha' },
  { date: '2024-06-18', name: 'Cuti Bersama' },
  { date: '2024-07-07', name: 'Tahun Baru Islam' },
  { date: '2024-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2024-09-16', name: 'Maulid Nabi Muhammad' },
  { date: '2024-12-25', name: 'Hari Natal' },
  { date: '2024-12-26', name: 'Cuti Bersama Natal' },
  
  // 2025
  { date: '2025-01-01', name: 'Tahun Baru Masehi' },
  { date: '2025-01-27', name: 'Isra Miraj' },
  { date: '2025-01-29', name: 'Tahun Baru Imlek' },
  { date: '2025-03-28', name: 'Cuti Bersama Idul Fitri' },
  { date: '2025-03-29', name: 'Hari Suci Nyepi' },
  { date: '2025-03-31', name: 'Hari Raya Idul Fitri' },
  { date: '2025-04-01', name: 'Hari Raya Idul Fitri' },
  { date: '2025-04-02', name: 'Cuti Bersama Idul Fitri' },
  { date: '2025-04-03', name: 'Cuti Bersama Idul Fitri' },
  { date: '2025-04-04', name: 'Cuti Bersama Idul Fitri' },
  { date: '2025-04-18', name: 'Wafat Isa Almasih' },
  { date: '2025-05-01', name: 'Hari Buruh' },
  { date: '2025-05-12', name: 'Hari Raya Waisak' },
  { date: '2025-05-29', name: 'Kenaikan Isa Almasih' },
  { date: '2025-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2025-06-06', name: 'Hari Raya Idul Adha' },
  { date: '2025-06-07', name: 'Cuti Bersama Idul Adha' },
  { date: '2025-06-27', name: 'Tahun Baru Islam' },
  { date: '2025-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2025-09-05', name: 'Maulid Nabi Muhammad' },
  { date: '2025-12-25', name: 'Hari Natal' },
  { date: '2025-12-26', name: 'Cuti Bersama Natal' },
  
  // 2026
  { date: '2026-01-01', name: 'Tahun Baru Masehi' },
  { date: '2026-01-17', name: 'Isra Miraj' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek' },
  { date: '2026-03-18', name: 'Hari Suci Nyepi' },
  { date: '2026-03-20', name: 'Hari Raya Idul Fitri' },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri' },
  { date: '2026-04-03', name: 'Wafat Isa Almasih' },
  { date: '2026-05-01', name: 'Hari Buruh' },
  { date: '2026-05-14', name: 'Kenaikan Isa Almasih' },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2026-06-02', name: 'Hari Raya Waisak' },
  { date: '2026-06-17', name: 'Tahun Baru Islam' },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2026-08-26', name: 'Maulid Nabi Muhammad' },
  { date: '2026-12-25', name: 'Hari Natal' },
];

/**
 * Check if a date is a weekend (Saturday/Sunday) or Indonesian national holiday
 */
export function isWeekendOrHoliday(year: number, month: number, day: number): { isHoliday: boolean; isWeekend: boolean; holidayName?: string } {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const holiday = indonesianHolidays.find(h => h.date === dateString);
  
  return {
    isHoliday: !!holiday,
    isWeekend,
    holidayName: holiday?.name
  };
}

/**
 * Get all weekends and holidays in a month
 */
export function getWeekendsAndHolidays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: number[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const { isWeekend, isHoliday } = isWeekendOrHoliday(year, month, day);
    if (isWeekend || isHoliday) {
      result.push(day);
    }
  }
  
  return result;
}

/**
 * Get weekends only (Saturday/Sunday)
 */
export function getWeekends(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: number[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      result.push(day);
    }
  }
  
  return result;
}

/**
 * Get holiday info for a specific day
 */
export function getHolidayInfo(year: number, month: number, day: number): Holiday | undefined {
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return indonesianHolidays.find(h => h.date === dateString);
}
