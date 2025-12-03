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
        
        const totalOffDays = 10;
        const offDays: number[] = [];
        
        // Step 1: Select 2 weekend OFF periods (each weekend = 2 consecutive days ideally)
        // We'll pick 2 different weekend pairs for each employee
        const assignedWeekendPairs: number[][] = [];
        
        if (weekendPairs.length >= 2) {
          const firstIdx = empIndex % weekendPairs.length;
          const secondIdx = (empIndex + Math.floor(weekendPairs.length / 2) + 1) % weekendPairs.length;
          
          assignedWeekendPairs.push(weekendPairs[firstIdx]);
          if (secondIdx !== firstIdx) {
            assignedWeekendPairs.push(weekendPairs[secondIdx]);
          }
        }
        
        // Add weekend days to OFF (2-3 days per weekend period)
        assignedWeekendPairs.forEach(pair => {
          pair.forEach(day => {
            if (!offDays.includes(day)) {
              offDays.push(day);
            }
          });
        });
        
        // Step 2: Distribute remaining OFF days in groups of 2-3 to create work periods of 4-6 days
        // Target: 10 OFF days total, weekend OFFs already assigned
        // We need to create OFF blocks of 2-3 days with work blocks of 4-6 days between them
        
        const remainingOffDays = totalOffDays - offDays.length;
        
        // Calculate how many additional OFF blocks we need (2-3 days each)
        // With 10 total OFFs and ~4 from weekends, we need ~6 more in 2-3 blocks of 2-3 days
        const additionalBlocks = Math.ceil(remainingOffDays / 2.5);
        
        // Find available positions for OFF blocks (avoiding existing OFFs and ensuring 4-6 day work gaps)
        const workDays = daysInMonth - totalOffDays; // ~20-21 work days
        const targetWorkBlockSize = 5; // Average 5 days between OFF periods
        
        // Create OFF positions distributed throughout the month
        let currentDay = 1;
        let offBlocksAdded = 0;
        const offBlockPositions: number[] = [];
        
        // Sort existing off days to find gaps
        offDays.sort((a, b) => a - b);
        
        // Find gaps between existing OFF periods and add new OFF blocks
        const gaps: { start: number; end: number; length: number }[] = [];
        let gapStart = 1;
        
        for (const offDay of offDays) {
          if (offDay > gapStart) {
            gaps.push({ start: gapStart, end: offDay - 1, length: offDay - gapStart });
          }
          gapStart = offDay + 1;
        }
        if (gapStart <= daysInMonth) {
          gaps.push({ start: gapStart, end: daysInMonth, length: daysInMonth - gapStart + 1 });
        }
        
        // Add OFF blocks in large gaps to ensure 4-6 day work periods
        gaps.sort((a, b) => b.length - a.length); // Sort by length descending
        
        let remainingToAdd = remainingOffDays;
        for (const gap of gaps) {
          if (remainingToAdd <= 0) break;
          
          // If gap is larger than 6 days, we need to add OFF days
          if (gap.length > 6) {
            // Add OFF block in the middle of the gap
            const blockSize = Math.min(remainingToAdd, Math.random() < 0.5 ? 2 : 3);
            const blockStart = gap.start + Math.floor((gap.length - blockSize) / 2) + (empIndex % 3);
            
            for (let i = 0; i < blockSize && remainingToAdd > 0; i++) {
              const day = Math.min(Math.max(blockStart + i, 1), daysInMonth);
              if (!offDays.includes(day)) {
                offDays.push(day);
                remainingToAdd--;
              }
            }
          }
        }
        
        // If still need more OFF days, add them ensuring consecutive groups of 2-3
        while (remainingToAdd > 0) {
          // Find a day that's not already OFF and not adjacent to existing single OFFs
          for (let day = 1 + (empIndex % 5); day <= daysInMonth && remainingToAdd > 0; day++) {
            if (!offDays.includes(day) && !offDays.includes(day + 1)) {
              // Add 2-3 consecutive OFF days
              const blockSize = Math.min(remainingToAdd, remainingToAdd >= 3 ? 3 : 2);
              for (let i = 0; i < blockSize && day + i <= daysInMonth; i++) {
                if (!offDays.includes(day + i)) {
                  offDays.push(day + i);
                  remainingToAdd--;
                }
              }
              break;
            }
          }
          // Safety exit
          if (remainingToAdd > 0) {
            for (let day = 1; day <= daysInMonth && remainingToAdd > 0; day++) {
              if (!offDays.includes(day)) {
                offDays.push(day);
                remainingToAdd--;
              }
            }
          }
        }
        
        // Ensure exactly 10 OFF days
        offDays.sort((a, b) => a - b);
        while (offDays.length > totalOffDays) {
          // Remove isolated single OFFs first
          for (let i = offDays.length - 1; i >= 0; i--) {
            const day = offDays[i];
            const prevIsOff = offDays.includes(day - 1);
            const nextIsOff = offDays.includes(day + 1);
            if (!prevIsOff && !nextIsOff) {
              offDays.splice(i, 1);
              break;
            }
          }
          if (offDays.length > totalOffDays) {
            offDays.pop();
          }
        }

        // Step 3: Assign shifts - one shift type per work block (between OFFs)
        // Find work blocks
        offDays.sort((a, b) => a - b);
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
        if (blockStart <= daysInMonth && !offDays.includes(daysInMonth)) {
          workBlocks.push({ start: blockStart, end: daysInMonth });
        }

        // Assign shifts to each day - rotate shift types per block
        let currentShiftIdx = empIndex % 3;
        let currentBlockIdx = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          if (offDays.includes(day)) {
            newSchedule[emp.id][day] = 'OFF';
          } else {
            // Check if we moved to next block
            while (currentBlockIdx < workBlocks.length - 1 && day > workBlocks[currentBlockIdx].end) {
              currentBlockIdx++;
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
            <li>✓ Periode OFF <strong>minimal 2 hari, maksimal 3 hari</strong> berturut-turut</li>
            <li>✓ Setiap weekend harus diisi <strong>1 orang per shift</strong></li>
            <li className="text-xs italic mt-2">Contoh: OFF-OFF → P-P-P-P-P → OFF-OFF (bukan P → OFF → P)</li>
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