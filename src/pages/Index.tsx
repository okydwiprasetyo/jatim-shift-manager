import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShiftCalendar } from '@/components/ShiftCalendar';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { ExportButtons } from '@/components/ExportButtons';
import { ScheduleGenerator } from '@/components/ScheduleGenerator';
import { employees, sampleSchedules } from '@/lib/sampleData';
import { MonthSchedule } from '@/types/shift';
import { getMonthName } from '@/lib/shiftUtils';
import { Calendar } from 'lucide-react';

const Index = () => {
  const [schedules, setSchedules] = useState<MonthSchedule[]>(sampleSchedules);
  const [currentScheduleId, setCurrentScheduleId] = useState<string>('dec-2025');

  const currentSchedule = schedules.find(s => s.id === currentScheduleId) || schedules[0];

  const handleScheduleUpdate = (updatedSchedule: MonthSchedule) => {
    setSchedules(prev =>
      prev.map(s => (s.id === updatedSchedule.id ? updatedSchedule : s))
    );
  };

  const handleGenerateSchedule = (newSchedule: MonthSchedule) => {
    setSchedules(prev => {
      const exists = prev.find(s => s.month === newSchedule.month && s.year === newSchedule.year);
      if (exists) {
        return prev.map(s => 
          s.month === newSchedule.month && s.year === newSchedule.year ? newSchedule : s
        );
      }
      return [...prev, newSchedule];
    });
    setCurrentScheduleId(newSchedule.id || `${newSchedule.month}-${newSchedule.year}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-foreground rounded-lg flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Bank Jatim</h1>
                <p className="text-sm md:text-base opacity-90">Sistem Monitoring Jadwal Shift E-Channel</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Select value={currentScheduleId} onValueChange={setCurrentScheduleId}>
                <SelectTrigger className="w-[200px] bg-primary-foreground text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map(s => (
                    <SelectItem key={s.id} value={s.id || ''}>
                      {getMonthName(s.month)} {s.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Schedule Selector */}
      <div className="md:hidden container mx-auto px-4 py-4">
        <Select value={currentScheduleId} onValueChange={setCurrentScheduleId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schedules.map(s => (
              <SelectItem key={s.id} value={s.id || ''}>
                {getMonthName(s.month)} {s.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Action Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">
                {getMonthName(currentSchedule.month)} {currentSchedule.year}
              </h2>
              <p className="text-sm text-muted-foreground">
                {employees.length} Karyawan • Fairness Score: {' '}
                <span className="font-semibold">
                  {((currentSchedule.fairnessScore || 0) * 100).toFixed(0)}%
                </span>
              </p>
            </div>
            <ExportButtons schedule={currentSchedule} employees={employees} />
          </div>
        </Card>

        {/* Calendar View */}
        <div id="calendar-view">
          <ShiftCalendar
            schedule={currentSchedule}
            employees={employees}
            onUpdate={handleScheduleUpdate}
          />
        </div>

        {/* Statistics */}
        <StatisticsPanel schedule={currentSchedule} employees={employees} />

        {/* Generator */}
        <ScheduleGenerator
          baseSchedule={currentSchedule}
          employees={employees}
          onGenerate={handleGenerateSchedule}
        />

        {/* Footer Notes */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-3 text-primary">Catatan Penting:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Diketahui Oleh:</strong> Pjs. AVP Infrastruktur TI & Operasi</li>
            <li>• <strong>Rai Diaswara</strong></li>
            <li>• Setiap karyawan dapat libur 2x Weekend dalam sebulan = Keadilan</li>
            <li>• Distribusi shift harus merata untuk menjaga keseimbangan beban kerja</li>
            <li>• Generator AI mengoptimalkan jadwal berdasarkan fairness score</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default Index;
