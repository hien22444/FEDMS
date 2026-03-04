import {
  IcAccount,
  IcChevron,
  IcLogo,
  IcLogout,
  IcNotification,
  IcSetting,
  ROUTES,
} from '@/constants';
import { PRIVATE_HEADER_MENU } from '@/constants/static-menu';
import { logout } from '@/lib/actions';
import { userStore } from '@/stores';
import { cn } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { Avatar, Dropdown } from 'antd';
import { observer } from 'mobx-react-lite';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PrivateHeader = observer(() => {
  const { avatarUrl, fullname } = userStore.get();
  const { pathname } = useLocation();

  const { mutateAsync: logoutMutateAsync } = useMutation({
    mutationFn: logout,
  });
  const navigate = useNavigate();

  const renderMenuItems = () => {
    return PRIVATE_HEADER_MENU.map(item => {
      const isSelected = item.path === pathname;
      if (item.children.length) {
        return (
          <Dropdown
            menu={{
              items: item.children.map(child => ({
                key: child.title,
                className: 'text-sm text-gray-sub-title',
                label: (
                  <Link to={child.path || '#'}>{child.title}</Link>
                ),
              })),
            }}
            key={item.title}
            trigger={['click']}
          >
            <span
              className={cn(
                'px-3 border-b-[2px]  pt-5 pb-4 cursor-pointer flex items-center gap-1 text-gray-sub-title text-sm hover:text-black',
                isSelected
                  ? 'border-b-black text-black font-medium'
                  : 'border-b-transparent',
              )}
            >
              {item.title}
              <IcChevron className='size-3 text-gray-400 rotate-180' />
            </span>
          </Dropdown>
        );
      }

      return (
        <Link
          key={item.title}
          to={item.path || '#'}
          className={cn(
            'px-3 pt-5 pb-4 border-b-[2px] cursor-pointer text-gray-sub-title text-sm hover:text-black',
            isSelected
              ? 'border-b-black text-black font-medium'
              : 'border-b-transparent',
          )}
        >
          {item.title}
        </Link>
      );
    });
  };

  return (
    <div className='bg-white sticky top-0 z-[100] border-b w-full border-gray-default '>
      <div className='max-w-heading flex justify-between items-center'>
        <div className='flex items-center gap-2'>
          <Link
            to={ROUTES.LANDING}
            className='flex items-center gap-2'
          >
            <IcLogo className='size-8' />
            <p className='font-bold text-lg'>React Source</p>
          </Link>

          <nav className='flex items-center gap-2 ml-6'>
            {renderMenuItems()}
          </nav>
        </div>
        <div className='flex items-center gap-1.5'>
          <IcNotification className='size-4 text-gray-sub-title' />
          <Dropdown
            menu={{
              items: [
                {
                  icon: <IcAccount className='size-4' />,
                  label: 'Profile',
                  key: 'profile',
                },
                {
                  icon: <IcSetting className='size-4' />,
                  key: 'settings',
                  label: 'Settings',
                },
                {
                  icon: <IcLogout className='size-4' />,
                  label: 'Logout',
                  key: 'logout',
                  className: '!text-red-500 hover:!bg-red-100',
                  onClick: async () => {
                    await logoutMutateAsync();
                    navigate(ROUTES.SIGN_IN);
                  },
                },
              ],
            }}
            placement='bottomRight'
            trigger={['click']}
          >
            <button className='flex items-center gap-1.5 py-2'>
              <Avatar
                src={avatarUrl}
                className='border-none'
                icon={
                  <span className='p-2 bg-orange-500 text-white rounded-full w-full text-xs'>
                    {fullname?.charAt(0) || 'U'}
                  </span>
                }
              />
              <p className='text-gray-sub-title text-sm'>
                {fullname}
              </p>
              <IcChevron className='rotate-180 size-4 text-gray-sub-title' />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
});

PrivateHeader.displayName = 'PrivateHeader';

export { PrivateHeader };
