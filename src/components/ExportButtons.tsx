import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { MonthSchedule, Employee } from '@/types/shift';
import { getMonthName } from '@/lib/shiftUtils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ExportButtonsProps {
  schedule: MonthSchedule;
  employees: Employee[];
}

export const ExportButtons = ({ schedule, employees }: ExportButtonsProps) => {
  const exportToExcel = () => {
    try {
      const daysInMonth = new Date(schedule.year, schedule.month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      // Create header row
      const headers = ['No', 'Nama', ...days.map(d => d.toString())];
      
      // Create data rows
      const data = employees.map((emp, idx) => {
        const row: any = {
          'No': idx + 1,
          'Nama': emp.name
        };
        days.forEach(day => {
          row[day.toString()] = schedule.schedule[emp.id]?.[day] || 'OFF';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${getMonthName(schedule.month)}-${schedule.year}`);

      XLSX.writeFile(wb, `Jadwal_Shift_${getMonthName(schedule.month)}_${schedule.year}.xlsx`);
      toast.success('Jadwal berhasil diexport ke Excel!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export ke Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('calendar-view');
      if (!element) {
        toast.error('Calendar view tidak ditemukan');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Jadwal_Shift_${getMonthName(schedule.month)}_${schedule.year}.pdf`);
      toast.success('Jadwal berhasil diexport ke PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Gagal export ke PDF');
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToExcel} variant="outline">
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export Excel
      </Button>
      <Button onClick={exportToPDF} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};
