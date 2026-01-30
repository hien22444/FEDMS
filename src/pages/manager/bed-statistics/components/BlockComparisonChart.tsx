import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { RiBarChartHorizontalLine } from 'react-icons/ri';
import type { IBlockStatistics } from '@/interfaces/manager.interface';

interface BlockComparisonChartProps {
  data: IBlockStatistics[];
}

export default function BlockComparisonChart({ data }: BlockComparisonChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RiBarChartHorizontalLine className="text-orange-500" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900">Block Comparison</h3>
          <p className="text-xs text-gray-500">Occupancy rate by dormitory block</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
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
              tick={{ fontSize: 12, fill: '#374151' }}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Occupancy Rate']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar
              dataKey="occupancyRate"
              radius={[0, 6, 6, 0]}
              barSize={28}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.occupancyRate >= 90 ? '#EF4444' : entry.occupancyRate >= 70 ? '#F97316' : '#10B981'}
                />
              ))}
              <LabelList
                dataKey="occupancyRate"
                position="right"
                formatter={(value: number) => `${value}%`}
                style={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600">&lt; 70% (Good)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-600">70-90% (High)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600">&gt; 90% (Critical)</span>
        </div>
      </div>
    </div>
  );
}
