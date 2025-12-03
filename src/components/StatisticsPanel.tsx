import { Card } from '@/components/ui/card';
import { MonthSchedule, Employee } from '@/types/shift';
import { calculateStatistics, calculateFairnessScore, getFairnessColor } from '@/lib/shiftUtils';

interface StatisticsPanelProps {
  schedule: MonthSchedule;
  employees: Employee[];
}

export const StatisticsPanel = ({ schedule, employees }: StatisticsPanelProps) => {
  const statistics = calculateStatistics(schedule, employees);
  const fairnessScore = calculateFairnessScore(statistics);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Statistik & Fairness</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Fairness Score:</span>
          <span className={`text-2xl font-bold ${getFairnessColor(fairnessScore)}`}>
            {(fairnessScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-sm font-semibold text-left">Nama</th>
              <th className="border border-border p-2 text-sm font-semibold">Total Hari</th>
              <th className="border border-border p-2 text-sm font-semibold">Libur</th>
              <th className="border border-border p-2 text-sm font-semibold">Masuk</th>
              <th className="border border-border p-2 text-sm font-semibold bg-shift-pagi/20">
                Pagi (P)
              </th>
              <th className="border border-border p-2 text-sm font-semibold bg-shift-sore/20">
                Sore (S)
              </th>
              <th className="border border-border p-2 text-sm font-semibold bg-shift-malam/20">
                Malam (M)
              </th>
            </tr>
          </thead>
          <tbody>
            {statistics.map((stat) => (
              <tr key={stat.employeeId} className="hover:bg-muted/50 transition-colors">
                <td className="border border-border p-2 font-medium">{stat.employeeName}</td>
                <td className="border border-border p-2 text-center">{stat.totalHari}</td>
                <td className="border border-border p-2 text-center">{stat.libur}</td>
                <td className="border border-border p-2 text-center">{stat.masuk}</td>
                <td className="border border-border p-2 text-center bg-shift-pagi/10">{stat.pagi}</td>
                <td className="border border-border p-2 text-center bg-shift-sore/10">{stat.sore}</td>
                <td className="border border-border p-2 text-center bg-shift-malam/10">{stat.malam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Catatan Fairness:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Setiap karyawan diusahakan mendapat libur 2x weekend dalam sebulan</li>
          <li>• Distribusi shift harus merata untuk keadilan</li>
          <li>• Max consecutive days: 5 hari berturut-turut</li>
          <li>• Periode kerja: minimal 4 hari, maksimal 6 hari</li>
        </ul>
      </div>
    </Card>
  );
};
