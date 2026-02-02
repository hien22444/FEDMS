import { Select, DatePicker } from 'antd';
import { Filter } from 'lucide-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  onDateChange?: (dates: [string, string] | null) => void;
  onBlockChange?: (block: string) => void;
  onStatusChange?: (status: string) => void;
}

const blockOptions = [
  { value: 'all', label: 'All Blocks' },
  { value: 'A', label: 'Block A' },
  { value: 'B', label: 'Block B' },
  { value: 'C', label: 'Block C' },
  { value: 'D', label: 'Block D' },
  { value: 'E', label: 'Block E' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'full', label: 'Full' },
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function FilterBar({
  onDateChange,
  onBlockChange,
  onStatusChange,
}: FilterBarProps) {
  const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onDateChange?.([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    } else {
      onDateChange?.(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-gray-600">
        <Filter size={20} />
        <span className="font-medium text-sm">Filters:</span>
      </div>

      <RangePicker
        onChange={handleDateChange}
        className="min-w-[240px]"
        placeholder={['Start Date', 'End Date']}
        allowClear
      />

      <Select
        defaultValue="all"
        options={blockOptions}
        onChange={onBlockChange}
        className="min-w-[140px]"
        placeholder="Select Block"
      />

      <Select
        defaultValue="all"
        options={statusOptions}
        onChange={onStatusChange}
        className="min-w-[140px]"
        placeholder="Select Status"
      />
    </div>
  );
}
