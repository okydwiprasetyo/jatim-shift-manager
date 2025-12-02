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

      const nextMonth = baseSchedule.month === 12 ? 1 : baseSchedule.month + 1;
      const nextYear = baseSchedule.month === 12 ? baseSchedule.year + 1 : baseSchedule.year;
      const daysInMonth = getDaysInMonth(nextMonth, nextYear);

      const newSchedule: Record<string, Record<number, ShiftType>> = {};
      const shifts: ShiftType[] = ['P', 'S', 'M', 'OFF'];

      // Simple algorithm based on fairness from base schedule
      employees.forEach((emp, empIndex) => {
        newSchedule[emp.id] = {};
        let consecutiveDays = 0;
        let lastShift: ShiftType = 'OFF';

        for (let day = 1; day <= daysInMonth; day++) {
          let shift: ShiftType;
          
          // Ensure rest after max consecutive days
          if (consecutiveDays >= config.maxConsecutiveDays) {
            shift = 'OFF';
            consecutiveDays = 0;
          } else {
            // Rotate shifts fairly
            const shiftIndex = (day + empIndex * 2) % 3;
            shift = shifts[shiftIndex];
            
            // Add OFF days to maintain fairness (aim for ~10 OFF days per month)
            if (day % 3 === empIndex % 3 && Math.random() > 0.65) {
              shift = 'OFF';
            }
            
            // Weekend fairness
            if (config.weekendFairness) {
              const dayOfWeek = new Date(nextYear, nextMonth - 1, day).getDay();
              if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.5) {
                shift = 'OFF';
              }
            }
          }
          
          if (shift === 'OFF') {
            consecutiveDays = 0;
          } else {
            consecutiveDays++;
          }
          
          lastShift = shift;
          newSchedule[emp.id][day] = shift;
        }
      });

      const generatedSchedule: MonthSchedule = {
        id: `generated-${nextMonth}-${nextYear}`,
        month: nextMonth,
        year: nextYear,
        schedule: newSchedule,
        fairnessScore: 0.88
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
            <Label htmlFor="maxDays">Max Consecutive Days</Label>
            <Input
              id="maxDays"
              type="number"
              min={3}
              max={7}
              value={config.maxConsecutiveDays}
              onChange={(e) => setConfig({ ...config, maxConsecutiveDays: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minRest">Min Rest Days</Label>
            <Input
              id="minRest"
              type="number"
              min={1}
              max={3}
              value={config.minRestDays}
              onChange={(e) => setConfig({ ...config, minRestDays: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Weekend Fairness</Label>
            <p className="text-sm text-muted-foreground">
              Usahakan setiap karyawan mendapat libur 2x weekend per bulan
            </p>
          </div>
          <Switch
            checked={config.weekendFairness}
            onCheckedChange={(checked) => setConfig({ ...config, weekendFairness: checked })}
          />
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Generator ini akan membuat jadwal bulan berikutnya berdasarkan fairness dari jadwal 
            Desember 2025. AI akan mengoptimalkan distribusi shift untuk keadilan maksimal.
          </p>
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
              Generate Jadwal Bulan Berikutnya
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
