import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthSchedule, ShiftType, Employee } from '@/types/shift';
import { getShiftColor, getDaysInMonth } from '@/lib/shiftUtils';
import { Edit2, Save, X } from 'lucide-react';

interface ShiftCalendarProps {
  schedule: MonthSchedule;
  employees: Employee[];
  onUpdate: (schedule: MonthSchedule) => void;
}

export const ShiftCalendar = ({ schedule, employees, onUpdate }: ShiftCalendarProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState(schedule);

  const daysInMonth = getDaysInMonth(schedule.month, schedule.year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleShiftChange = (employeeId: string, day: number, shift: ShiftType) => {
    setEditedSchedule(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [employeeId]: {
          ...prev.schedule[employeeId],
          [day]: shift
        }
      }
    }));
  };

  const handleSave = () => {
    onUpdate(editedSchedule);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedSchedule(schedule);
    setEditMode(false);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">
          Jadwal Shift - {schedule.month}/{schedule.year}
        </h2>
        <div className="flex gap-2">
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Mode
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} variant="default">
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="border border-border p-2 text-sm font-semibold sticky left-0 bg-primary z-10">
                Nama
              </th>
              {days.map(day => (
                <th key={day} className="border border-border p-2 text-sm font-semibold min-w-[50px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                <td className="border border-border p-2 font-medium sticky left-0 bg-background z-10">
                  {emp.name}
                </td>
                {days.map(day => {
                  const shift = (editMode ? editedSchedule : schedule).schedule[emp.id]?.[day] || 'OFF';
                  return (
                    <td key={day} className="border border-border p-1">
                      {editMode ? (
                        <Select
                          value={shift}
                          onValueChange={(value: ShiftType) => handleShiftChange(emp.id, day, value)}
                        >
                          <SelectTrigger className={`w-full h-8 ${getShiftColor(shift)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="OFF">OFF</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`${getShiftColor(shift)} rounded px-2 py-1 text-center font-semibold text-sm`}>
                          {shift}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-shift-pagi rounded"></div>
            <span>P = Pagi (06:00-14:00)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-shift-sore rounded"></div>
            <span>S = Sore (14:00-22:00)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-shift-malam rounded"></div>
            <span>M = Malam (22:00-06:00)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-shift-off rounded"></div>
            <span>OFF = Libur</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
