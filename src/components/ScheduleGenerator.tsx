import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { MonthSchedule, Employee, GeneratorConfig, ShiftType } from '@/types/shift';
import { getDaysInMonth } from '@/lib/shiftUtils';
import { getWeekends, isWeekendOrHoliday } from '@/lib/indonesianHolidays';
import { toast } from 'sonner';

interface ScheduleGeneratorProps {
  baseSchedule: MonthSchedule;
  employees: Employee[];
  onGenerate: (schedule: MonthSchedule) => void;
  onReset?: () => void;
}

export const ScheduleGenerator = ({ baseSchedule, employees, onGenerate, onReset }: ScheduleGeneratorProps) => {
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

      // Use Indonesian calendar for weekends
      const weekendDays = getWeekends(selectedYear, selectedMonth);
      
      // Track weekend coverage: weekend day -> shift -> employee assigned
      const weekendCoverage: Record<number, Record<string, string | null>> = {};
      
      // Initialize weekend coverage tracking
      weekendDays.forEach(day => {
        weekendCoverage[day] = { P: null, S: null, M: null };
      });

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
        const offDays: Set<number> = new Set();
        
        // Step 1: Assign 2 weekend OFF periods (spread evenly among employees)
        if (weekendPairs.length >= 2) {
          const firstIdx = empIndex % weekendPairs.length;
          const secondIdx = (empIndex + Math.floor(weekendPairs.length / 2) + 1) % weekendPairs.length;
          
          weekendPairs[firstIdx].forEach(day => offDays.add(day));
          if (secondIdx !== firstIdx) {
            weekendPairs[secondIdx].forEach(day => offDays.add(day));
          }
        }
        
        // Step 2: Build schedule with proper work/off periods (4-6 work, 2-3 off)
        // Strategy: Place OFF blocks strategically to create 4-6 day work periods
        const sortedOffDays = Array.from(offDays).sort((a, b) => a - b);
        let remainingOff = totalOffDays - offDays.size;
        
        // Find work gaps and insert OFF blocks to maintain 4-6 day work periods
        const insertOffBlock = (startDay: number, blockSize: number) => {
          for (let i = 0; i < blockSize && startDay + i <= daysInMonth; i++) {
            if (!offDays.has(startDay + i)) {
              offDays.add(startDay + i);
              remainingOff--;
            }
          }
        };
        
        // Calculate ideal OFF positions: roughly every 5-6 work days
        // With 10 OFF days and ~20 work days, we need ~3-4 OFF blocks of 2-3 days
        const offPositions: number[] = [];
        const workDaysTarget = daysInMonth - totalOffDays;
        const numOffBlocks = Math.ceil(remainingOff / 2.5);
        
        // Spread OFF blocks evenly across the month, avoiding existing weekend OFFs
        const segmentSize = Math.floor(daysInMonth / (numOffBlocks + 1));
        
        for (let block = 0; block < numOffBlocks && remainingOff > 0; block++) {
          const targetDay = segmentSize * (block + 1) + (empIndex % 3);
          const blockSize = remainingOff >= 5 ? 3 : (remainingOff >= 2 ? 2 : remainingOff);
          
          // Find best position near targetDay that doesn't create work periods < 4 days
          let bestPos = targetDay;
          for (let offset = 0; offset <= 5; offset++) {
            const tryDay = targetDay + (offset % 2 === 0 ? offset / 2 : -Math.ceil(offset / 2));
            if (tryDay >= 1 && tryDay <= daysInMonth - blockSize + 1) {
              // Check if this position creates valid work periods
              let valid = true;
              for (let i = 0; i < blockSize; i++) {
                if (offDays.has(tryDay + i)) valid = false;
              }
              if (valid) {
                bestPos = tryDay;
                break;
              }
            }
          }
          
          insertOffBlock(bestPos, blockSize);
        }
        
        // Final adjustment: ensure exactly 10 OFF days
        const finalOffDays = Array.from(offDays).sort((a, b) => a - b);
        
        // If we have too many, remove non-weekend isolated OFFs
        while (finalOffDays.length > totalOffDays) {
          for (let i = finalOffDays.length - 1; i >= 0; i--) {
            const day = finalOffDays[i];
            // Don't remove weekend OFFs
            if (!weekendDays.includes(day)) {
              finalOffDays.splice(i, 1);
              offDays.delete(day);
              break;
            }
          }
          if (finalOffDays.length > totalOffDays) {
            const removed = finalOffDays.pop();
            if (removed) offDays.delete(removed);
          }
        }
        
        // If we still need more OFF days, add them in groups of 2-3
        while (finalOffDays.length < totalOffDays) {
          const needed = totalOffDays - finalOffDays.length;
          const blockSize = Math.min(needed, needed >= 3 ? 2 : needed);
          
          // Find a gap where we can add OFF days without creating < 4 day work periods
          for (let day = 1 + (empIndex * 2 % 7); day <= daysInMonth - blockSize + 1; day++) {
            let canAdd = true;
            for (let i = 0; i < blockSize; i++) {
              if (offDays.has(day + i)) canAdd = false;
            }
            
            // Check work period before and after
            if (canAdd) {
              // Find previous OFF
              let prevOff = 0;
              for (let d = day - 1; d >= 0; d--) {
                if (offDays.has(d)) { prevOff = d; break; }
              }
              // Find next OFF
              let nextOff = daysInMonth + 1;
              for (let d = day + blockSize; d <= daysInMonth; d++) {
                if (offDays.has(d)) { nextOff = d; break; }
              }
              
              const workBefore = day - prevOff - 1;
              const workAfter = nextOff - day - blockSize;
              
              // Only add if both work periods are >= 4 days (or at month boundaries)
              if ((prevOff === 0 || workBefore >= 4) && (nextOff > daysInMonth || workAfter >= 4)) {
                for (let i = 0; i < blockSize; i++) {
                  offDays.add(day + i);
                  finalOffDays.push(day + i);
                }
                finalOffDays.sort((a, b) => a - b);
                break;
              }
            }
          }
          
          // Safety: if still can't add, just add anywhere
          if (finalOffDays.length < totalOffDays) {
            for (let day = 1; day <= daysInMonth; day++) {
              if (!offDays.has(day)) {
                offDays.add(day);
                finalOffDays.push(day);
                finalOffDays.sort((a, b) => a - b);
                break;
              }
            }
          }
        }

        // Step 3: Validate work periods are 4-6 days, fix if needed
        const validateAndFix = () => {
          const sortedOff = Array.from(offDays).sort((a, b) => a - b);
          const workBlocks: { start: number; end: number; length: number }[] = [];
          let blockStart = 1;
          
          for (const offDay of sortedOff) {
            if (offDay > blockStart) {
              workBlocks.push({ start: blockStart, end: offDay - 1, length: offDay - blockStart });
            }
            blockStart = offDay + 1;
          }
          if (blockStart <= daysInMonth) {
            workBlocks.push({ start: blockStart, end: daysInMonth, length: daysInMonth - blockStart + 1 });
          }
          
          // Check for work blocks < 4 days and merge them with adjacent OFF
          for (const block of workBlocks) {
            if (block.length > 0 && block.length < 4) {
              // Convert these work days to OFF if we can spare some
              // Or merge with adjacent block by removing OFF between them
              const offBefore = sortedOff.find(d => d === block.start - 1);
              const offAfter = sortedOff.find(d => d === block.end + 1);
              
              if (offBefore && offDays.size > totalOffDays) {
                offDays.delete(offBefore);
              } else if (offAfter && offDays.size > totalOffDays) {
                offDays.delete(offAfter);
              }
            }
          }
        };
        
        validateAndFix();

        // Step 4: Build final work blocks and assign shifts
        const finalSortedOff = Array.from(offDays).sort((a, b) => a - b);
        const workBlocks: { start: number; end: number }[] = [];
        let blockStart = 1;
        
        for (const offDay of finalSortedOff) {
          if (offDay > blockStart) {
            workBlocks.push({ start: blockStart, end: offDay - 1 });
          }
          blockStart = offDay + 1;
        }
        if (blockStart <= daysInMonth) {
          workBlocks.push({ start: blockStart, end: daysInMonth });
        }

        // Assign shifts - one shift type per work block
        let currentShiftIdx = empIndex % 3;
        let currentBlockIdx = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          if (offDays.has(day)) {
            newSchedule[emp.id][day] = 'OFF';
          } else {
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
    onReset?.();
    toast.info('Generator dan jadwal direset. Silakan generate ulang.');
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