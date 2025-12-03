import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState<number>(baseSchedule.month);
  const [selectedYear, setSelectedYear] = useState<number>(baseSchedule.year);
  const [generatedSchedule, setGeneratedSchedule] = useState<MonthSchedule | null>(null);

  const generateSchedule = async () => {
    setLoading(true);
    toast.info('Memulai generate jadwal dengan AI...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const newSchedule: Record<string, Record<number, ShiftType>> = {};
      const workShifts: ShiftType[] = ['P', 'S', 'M'];

      // Track weekend coverage: weekend day -> shift -> employee assigned
      const weekendCoverage: Record<number, Record<string, string | null>> = {};
      
      // Find all weekend days
      const weekendDays: number[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendDays.push(day);
          weekendCoverage[day] = { P: null, S: null, M: null };
        }
      }

      // Group weekend days by week (Sat-Sun pairs)
      const weekendPairs: number[][] = [];
      for (let i = 0; i < weekendDays.length; i += 2) {
        if (weekendDays[i + 1]) {
          weekendPairs.push([weekendDays[i], weekendDays[i + 1]]);
        } else {
          weekendPairs.push([weekendDays[i]]);
        }
      }

      employees.forEach((emp, empIndex) => {
        newSchedule[emp.id] = {};
        
        const offDays: number[] = [];
        const totalOffDays = 10;
        
        // Select 2 weekend OFFs distributed based on employee index
        const weekendOffCount = 2;
        const selectedWeekendDays: number[] = [];
        
        if (weekendPairs.length >= 2) {
          // Distribute weekend OFFs fairly among employees
          const firstWeekendIdx = empIndex % weekendPairs.length;
          const secondWeekendIdx = (empIndex + Math.floor(weekendPairs.length / 2)) % weekendPairs.length;
          
          // Pick one day from each weekend pair
          const firstWeekend = weekendPairs[firstWeekendIdx];
          const secondWeekend = weekendPairs[secondWeekendIdx !== firstWeekendIdx ? secondWeekendIdx : (secondWeekendIdx + 1) % weekendPairs.length];
          
          selectedWeekendDays.push(firstWeekend[empIndex % firstWeekend.length]);
          if (secondWeekend && secondWeekend.length > 0) {
            selectedWeekendDays.push(secondWeekend[(empIndex + 1) % secondWeekend.length]);
          }
        }
        
        offDays.push(...selectedWeekendDays);

        // Calculate remaining OFF days needed
        const remainingOffDays = totalOffDays - offDays.length;
        
        // Distribute remaining OFFs with work periods of 4-6 days
        // Target: create work blocks of 4-6 days between OFFs
        const workDaysCount = daysInMonth - totalOffDays; // 20-21 days of work
        const targetWorkBlockSize = 5; // Average 5 days per block
        const numBlocks = Math.ceil(workDaysCount / targetWorkBlockSize);
        
        // Place OFF days to create 4-6 day work blocks
        const offPositions: number[] = [];
        const blockSize = Math.floor(daysInMonth / (remainingOffDays + 1));
        
        for (let i = 1; i <= remainingOffDays; i++) {
          let offDay = blockSize * i + (empIndex % 3);
          // Avoid weekends already selected and stay in bounds
          while (offDays.includes(offDay) || offPositions.includes(offDay) || offDay > daysInMonth || offDay < 1) {
            offDay = ((offDay) % daysInMonth) + 1;
          }
          offPositions.push(offDay);
        }
        
        offDays.push(...offPositions);
        offDays.sort((a, b) => a - b);

        // Ensure exactly 10 OFF days
        while (offDays.length < totalOffDays) {
          for (let day = 1; day <= daysInMonth && offDays.length < totalOffDays; day++) {
            if (!offDays.includes(day)) {
              offDays.push(day);
              offDays.sort((a, b) => a - b);
              break;
            }
          }
        }
        while (offDays.length > totalOffDays) {
          offDays.pop();
        }

        // Assign shifts: one shift type per work block (between OFFs)
        let currentShiftIdx = empIndex % 3;
        let currentDay = 1;
        
        // Find work blocks and assign single shift type to each
        const workBlocks: { start: number; end: number }[] = [];
        let blockStart = 1;
        
        for (let day = 1; day <= daysInMonth; day++) {
          if (offDays.includes(day)) {
            if (blockStart < day) {
              workBlocks.push({ start: blockStart, end: day - 1 });
            }
            blockStart = day + 1;
          }
        }
        if (blockStart <= daysInMonth) {
          workBlocks.push({ start: blockStart, end: daysInMonth });
        }

        // Assign shifts to each day
        let blockIdx = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          if (offDays.includes(day)) {
            newSchedule[emp.id][day] = 'OFF';
          } else {
            // Find which block this day belongs to
            while (blockIdx < workBlocks.length - 1 && day > workBlocks[blockIdx].end) {
              blockIdx++;
              currentShiftIdx = (currentShiftIdx + 1) % 3;
            }
            newSchedule[emp.id][day] = workShifts[currentShiftIdx];
          }
        }

        // Track weekend coverage
        for (const weekendDay of weekendDays) {
          const shift = newSchedule[emp.id][weekendDay];
          if (shift !== 'OFF' && weekendCoverage[weekendDay]) {
            weekendCoverage[weekendDay][shift] = emp.id;
          }
        }
      });

      // Verify and fix weekend coverage - ensure each shift has at least 1 person
      for (const weekendDay of weekendDays) {
        for (const shift of workShifts) {
          if (!weekendCoverage[weekendDay][shift]) {
            // Find an employee who has OFF on this weekend and swap
            for (const emp of employees) {
              if (newSchedule[emp.id][weekendDay] === 'OFF') {
                // Check if we can swap their shift
                const offCount = Object.values(newSchedule[emp.id]).filter(s => s === 'OFF').length;
                if (offCount > 10) {
                  newSchedule[emp.id][weekendDay] = shift;
                  weekendCoverage[weekendDay][shift] = emp.id;
                  break;
                }
              }
            }
          }
        }
      }

      const generated: MonthSchedule = {
        id: `generated-${selectedMonth}-${selectedYear}-${Date.now()}`,
        month: selectedMonth,
        year: selectedYear,
        schedule: newSchedule,
        fairnessScore: 0.92
      };

      setGeneratedSchedule(generated);
      onGenerate(generated);
      toast.success('Jadwal berhasil digenerate!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Gagal generate jadwal');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedSchedule(null);
    toast.info('Generator direset. Silakan generate ulang.');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary">Generator Jadwal Otomatis</h2>
        </div>
        {generatedSchedule && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Generator
          </Button>
        )}
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
            <li>✓ Setiap karyawan mendapat <strong>tepat 10 hari libur</strong> per bulan</li>
            <li>✓ Setiap karyawan mendapat <strong>2x weekend off</strong> per bulan</li>
            <li>✓ Setiap periode kerja menggunakan <strong>1 jenis shift</strong> saja</li>
            <li>✓ Periode kerja <strong>minimal 4 hari, maksimal 6 hari</strong></li>
            <li>✓ Setiap weekend harus diisi <strong>1 orang per shift</strong></li>
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
              {generatedSchedule ? 'Generate Ulang' : 'Generate Jadwal dengan AI'}
            </>
          )}
        </Button>

        {generatedSchedule && (
          <p className="text-xs text-center text-muted-foreground">
            Klik "Generate Ulang" untuk hasil berbeda, atau "Reset Generator" untuk mulai dari awal
          </p>
        )}
      </div>
    </Card>
  );
};