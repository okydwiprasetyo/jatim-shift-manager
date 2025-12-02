import { Employee, MonthSchedule, ShiftType } from "@/types/shift";

export const employees: Employee[] = [
  { id: '1', name: 'Harya', position: 'E-Channel Staff' },
  { id: '2', name: 'Oky', position: 'E-Channel Staff' },
  { id: '3', name: 'Onthen', position: 'E-Channel Staff' },
  { id: '4', name: 'Ofal', position: 'E-Channel Staff' },
  { id: '5', name: 'Tio', position: 'E-Channel Staff' },
  { id: '6', name: 'Indra', position: 'E-Channel Staff' },
];

// December 2025 schedule based on the provided image
const december2025: Record<string, Record<number, ShiftType>> = {
  '1': { // Harya
    1: 'S', 2: 'OFF', 3: 'OFF', 4: 'M', 5: 'M', 6: 'M', 7: 'OFF', 8: 'P', 9: 'P', 10: 'P',
    11: 'P', 12: 'P', 13: 'OFF', 14: 'OFF', 15: 'P', 16: 'M', 17: 'M', 18: 'OFF', 19: 'OFF',
    20: 'P', 21: 'P', 22: 'P', 23: 'P', 24: 'OFF', 25: 'OFF', 26: 'S', 27: 'S', 28: 'S',
    29: 'M', 30: 'M', 31: 'M'
  },
  '2': { // Oky
    1: 'OFF', 2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'P', 8: 'P', 9: 'OFF', 10: 'OFF',
    11: 'M', 12: 'M', 13: 'OFF', 14: 'OFF', 15: 'OFF', 16: 'P', 17: 'P', 18: 'P', 19: 'P',
    20: 'OFF', 21: 'OFF', 22: 'S', 23: 'S', 24: 'S', 25: 'S', 26: 'M', 27: 'M', 28: 'M',
    29: 'OFF', 30: 'OFF', 31: 'OFF'
  },
  '3': { // Onthen
    1: 'OFF', 2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'OFF', 7: 'OFF', 8: 'S', 9: 'S', 10: 'S',
    11: 'S', 12: 'S', 13: 'S', 14: 'S', 15: 'OFF', 16: 'OFF', 17: 'OFF', 18: 'M', 19: 'M',
    20: 'M', 21: 'M', 22: 'OFF', 23: 'OFF', 24: 'M', 25: 'M', 26: 'OFF', 27: 'OFF', 28: 'OFF',
    29: 'OFF', 30: 'P', 31: 'P'
  },
  '4': { // Ofal
    1: 'M', 2: 'S', 3: 'S', 4: 'OFF', 5: 'OFF', 6: 'OFF', 7: 'M', 8: 'M', 9: 'M', 10: 'M',
    11: 'M', 12: 'M', 13: 'OFF', 14: 'OFF', 15: 'OFF', 16: 'S', 17: 'S', 18: 'S', 19: 'S',
    20: 'S', 21: 'S', 22: 'S', 23: 'OFF', 24: 'OFF', 25: 'P', 26: 'P', 27: 'P', 28: 'OFF',
    29: 'OFF', 30: 'P', 31: 'P'
  },
  '5': { // Tio
    1: 'P', 2: 'M', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'OFF', 8: 'OFF', 9: 'OFF', 10: 'P',
    11: 'P', 12: 'P', 13: 'P', 14: 'P', 15: 'OFF', 16: 'OFF', 17: 'M', 18: 'M', 19: 'OFF',
    20: 'OFF', 21: 'OFF', 22: 'P', 23: 'P', 24: 'P', 25: 'P', 26: 'P', 27: 'P', 28: 'P',
    29: 'OFF', 30: 'OFF', 31: 'OFF'
  },
  '6': { // Indra
    1: 'OFF', 2: 'OFF', 3: 'OFF', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'M', 10: 'M',
    11: 'OFF', 12: 'OFF', 13: 'OFF', 14: 'P', 15: 'P', 16: 'P', 17: 'P', 18: 'P', 19: 'P',
    20: 'P', 21: 'OFF', 22: 'OFF', 23: 'M', 24: 'M', 25: 'M', 26: 'M', 27: 'OFF', 28: 'OFF',
    29: 'OFF', 30: 'S', 31: 'S'
  }
};

// Generate schedules for January-April 2026 with different patterns
const generateSchedule = (month: number, year: number, basePattern: number): Record<string, Record<number, ShiftType>> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule: Record<string, Record<number, ShiftType>> = {};
  const shifts: ShiftType[] = ['P', 'S', 'M', 'OFF'];
  
  employees.forEach((emp, empIndex) => {
    schedule[emp.id] = {};
    const offset = (empIndex + basePattern) % 4;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const shiftIndex = (day + offset + empIndex * 2) % shifts.length;
      let shift = shifts[shiftIndex];
      
      // Ensure fair distribution of OFF days (approximately 10 per month)
      if (day % 3 === empIndex % 3 && Math.random() > 0.6) {
        shift = 'OFF';
      }
      
      schedule[emp.id][day] = shift;
    }
  });
  
  return schedule;
};

export const sampleSchedules: MonthSchedule[] = [
  {
    id: 'dec-2025',
    month: 12,
    year: 2025,
    schedule: december2025,
    fairnessScore: 0.92
  },
  {
    id: 'jan-2026',
    month: 1,
    year: 2026,
    schedule: generateSchedule(1, 2026, 1),
    fairnessScore: 0.89
  },
  {
    id: 'feb-2026',
    month: 2,
    year: 2026,
    schedule: generateSchedule(2, 2026, 2),
    fairnessScore: 0.91
  },
  {
    id: 'mar-2026',
    month: 3,
    year: 2026,
    schedule: generateSchedule(3, 2026, 3),
    fairnessScore: 0.88
  },
  {
    id: 'apr-2026',
    month: 4,
    year: 2026,
    schedule: generateSchedule(4, 2026, 0),
    fairnessScore: 0.90
  }
];
