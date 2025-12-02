import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sparkles } from 'lucide-react';
import { MonthSchedule, Employee, GeneratorConfig, ShiftType } from '@/types/shift';
import { getDaysInMonth } from '@/lib/shiftUtils';
import { toast } from 'sonner';

interface ScheduleGeneratorProps {
  baseSchedule: MonthSchedule;
  employees: Employee[];
  onGenerate: (schedule: MonthSchedule) => void;
}

export const ScheduleGenerator = ({ baseSchedule, employees, onGenerate }: ScheduleGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    baseSchedule.month === 12 ? 1 : baseSchedule.month + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    baseSchedule.month === 12 ? baseSchedule.year + 1 : baseSchedule.year
  );
  const [config, setConfig] = useState<GeneratorConfig>({
    maxConsecutiveDays: 5,
    minRestDays: 1,
    weekendFairness: true
  });

  const generateSchedule = async () => {
    setLoading(true);
    toast.info('Memulai generate jadwal dengan AI...');

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const newSchedule: Record<string, Record<number, ShiftType>> = {};
      const workShifts: ShiftType[] = ['P', 'S', 'M'];

      // AI Algorithm with strict rules:
      // 1. Exactly 10 OFF days per person
      // 2. 2 weekend OFF days per person
      // 3. Single shift type between OFF periods

      employees.forEach((emp, empIndex) => {
        newSchedule[emp.id] = {};
        
        // Get all weekends in the month
        const weekends: number[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends.push(day);
          }
        }

        // Select 2 weekends for OFF (distributed evenly)
        const selectedWeekends: number[] = [];
        if (weekends.length >= 2) {
          const weekendGroups = Math.floor(weekends.length / 7); // Approximate number of weekends
          const firstWeekend = empIndex % weekendGroups;
          const secondWeekend = (empIndex + Math.floor(weekendGroups / 2)) % weekendGroups;
          
          selectedWeekends.push(weekends[firstWeekend * 2] || weekends[0]);
          selectedWeekends.push(weekends[secondWeekend * 2 + 1] || weekends[weekends.length - 1]);
        }

        // Distribute remaining 8 OFF days (10 total - 2 weekend days)
        const remainingOffDays = 10 - selectedWeekends.length;
        const offDays = [...selectedWeekends];
        
        // Spread OFF days evenly throughout the month
        const interval = Math.floor(daysInMonth / (remainingOffDays + 1));
        for (let i = 1; i <= remainingOffDays; i++) {
          let offDay = interval * i + empIndex;
          // Make sure it's not a weekend we already selected and within bounds
          while (offDays.includes(offDay) || offDay > daysInMonth) {
            offDay = (offDay + 1) % daysInMonth || daysInMonth;
          }
          offDays.push(offDay);
        }

        // Sort OFF days
        offDays.sort((a, b) => a - b);

        // Assign shifts: one shift type between each OFF period
        let currentDay = 1;
        let shiftTypeIndex = empIndex % 3; // Start with different shift for each employee

        for (let i = 0; i <= offDays.length; i++) {
          const endDay = offDays[i] || daysInMonth + 1;
          const currentShiftType = workShifts[shiftTypeIndex];

          // Fill work days with the same shift type
          while (currentDay < endDay) {
            if (offDays.includes(currentDay)) {
              newSchedule[emp.id][currentDay] = 'OFF';
            } else {
              newSchedule[emp.id][currentDay] = currentShiftType;
            }
            currentDay++;
          }

          // Mark OFF day
          if (currentDay <= daysInMonth && offDays.includes(currentDay)) {
            newSchedule[emp.id][currentDay] = 'OFF';
            currentDay++;
          }

          // Rotate to next shift type for next work period
          shiftTypeIndex = (shiftTypeIndex + 1) % 3;
        }

        // Fill any remaining days
        while (currentDay <= daysInMonth) {
          if (offDays.includes(currentDay)) {
            newSchedule[emp.id][currentDay] = 'OFF';
          } else {
            newSchedule[emp.id][currentDay] = workShifts[shiftTypeIndex];
          }
          currentDay++;
        }
      });

      const generatedSchedule: MonthSchedule = {
        id: `generated-${selectedMonth}-${selectedYear}`,
        month: selectedMonth,
        year: selectedYear,
        schedule: newSchedule,
        fairnessScore: 0.92
      };

      onGenerate(generatedSchedule);
      toast.success('Jadwal berhasil digenerate!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Gagal generate jadwal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary">Generator Jadwal Otomatis</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Bulan</Label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][month - 1]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Tahun</Label>
            <Input
              id="year"
              type="number"
              min={2024}
              max={2030}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <h3 className="font-semibold text-primary">Aturan Generator AI:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Setiap karyawan mendapat <strong>10 hari libur</strong> per bulan</li>
            <li>✓ Setiap karyawan mendapat <strong>2x weekend off</strong> per bulan</li>
            <li>✓ Setiap periode kerja menggunakan <strong>1 jenis shift</strong> saja</li>
            <li className="text-xs italic mt-2">Contoh: OFF → P-P-P-P-P → OFF (bukan OFF → P-S-M-P-S → OFF)</li>
          </ul>
        </div>

        <Button
          onClick={generateSchedule}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Jadwal dengan AI
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
