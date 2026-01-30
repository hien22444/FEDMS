import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { RiBarChartLine } from 'react-icons/ri';

interface BedUsageData {
  block: string;
  occupancyRate: number;
}

interface BedUsageChartProps {
  data: BedUsageData[];
}

export default function BedUsageChart({ data }: BedUsageChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RiBarChartLine className="text-gray-600" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900">Bed Usage by Block</h3>
          <p className="text-xs text-gray-500">Occupancy rate per block</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis
              type="category"
              dataKey="block"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={60}
            />
            <Bar dataKey="occupancyRate" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#f97316" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
