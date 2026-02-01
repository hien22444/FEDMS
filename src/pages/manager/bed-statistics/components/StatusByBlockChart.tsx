import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Layers } from 'lucide-react';
import type { IBlockStatistics } from '@/interfaces/manager.interface';

interface StatusByBlockChartProps {
  data: IBlockStatistics[];
}

export default function StatusByBlockChart({ data }: StatusByBlockChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="text-violet-500" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900">Status by Block</h3>
          <p className="text-xs text-gray-500">Bed status distribution per block</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis
              type="category"
              dataKey="block"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#374151' }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
            <Bar
              dataKey="occupied"
              name="Occupied"
              stackId="stack"
              fill="#3B82F6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="available"
              name="Available"
              stackId="stack"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="maintenance"
              name="Maintenance"
              stackId="stack"
              fill="#F97316"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
