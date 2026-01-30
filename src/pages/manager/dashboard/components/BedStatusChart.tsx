import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RiPieChartLine } from 'react-icons/ri';

interface BedStatusData {
  name: string;
  value: number;
  color: string;
}

interface BedStatusChartProps {
  data: {
    occupied: number;
    available: number;
    maintenance: number;
  };
}

export default function BedStatusChart({ data }: BedStatusChartProps) {
  const chartData: BedStatusData[] = [
    { name: 'Occupied', value: data.occupied, color: '#3B82F6' },
    { name: 'Available', value: data.available, color: '#10B981' },
    { name: 'Maintenance', value: data.maintenance, color: '#F97316' },
  ];

  const total = data.occupied + data.available + data.maintenance;

  const getPercentage = (value: number) => Math.round((value / total) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RiPieChartLine className="text-gray-600" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900">Bed Status Distribution</h3>
          <p className="text-xs text-gray-500">Current bed allocation status</p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-52 w-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="ml-4 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-semibold">{getPercentage(item.value)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
