import { Input, Button, Avatar, Badge, Dropdown } from 'antd';
import { Search, Bell, ChevronDown } from 'lucide-react';
import type { MenuProps } from 'antd';

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: 'My Profile' },
  { key: 'settings', label: 'Settings' },
  { type: 'divider' },
  { key: 'logout', label: 'Logout', danger: true },
];

export default function ManagerHeader() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search rooms, students, invoices..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          className="w-80"
          size="middle"
        />
      </div>

      <div className="flex items-center gap-4">
        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<Bell size={20} className="text-gray-600" />}
            className="flex items-center justify-center"
          />
        </Badge>

        <Button type="default">View Reports</Button>
        <Button type="primary" className="bg-orange-500 hover:bg-orange-600 border-orange-500">
          Create Invoice
        </Button>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <div className="flex items-center gap-2 cursor-pointer ml-2">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" size={36} />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">Admin User</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
