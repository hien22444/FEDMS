import { Input, Button, Avatar, Badge, Dropdown } from 'antd';
import { RiSearchLine, RiNotification3Line, RiArrowDownSLine } from 'react-icons/ri';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

export default function ManagerHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate(ROUTES.LANDING);
    } else if (key === 'profile') {
      navigate('/manager/settings');
    } else if (key === 'settings') {
      navigate('/manager/settings');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'My Profile' },
    { key: 'settings', label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', danger: true },
  ];
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-[280px] right-0 z-10">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search rooms, students, invoices..."
          prefix={<RiSearchLine className="w-4 h-4 text-gray-400" />}
          className="w-80"
          size="middle"
        />
      </div>

      <div className="flex items-center gap-4">
        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<RiNotification3Line size={20} className="text-gray-600" />}
            className="flex items-center justify-center"
          />
        </Badge>

        <Button type="default">View Reports</Button>
        <Button type="primary" className="bg-orange-500 hover:bg-orange-600 border-orange-500">
          Create Invoice
        </Button>

        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
          <div className="flex items-center gap-2 cursor-pointer ml-2">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" size={36} />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.fullname || 'Admin User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Manager'}</p>
            </div>
            <RiArrowDownSLine className="w-4 h-4 text-gray-400" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
