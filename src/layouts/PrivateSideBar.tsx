import {
  IcChevron,
  IcDashboard,
  IcFolder,
  PRIVATE_SETTING_MENU,
  ROUTES,
} from '@/constants';
import { useToggle } from '@/hooks';
import { cn } from '@/utils';
import { observer } from 'mobx-react-lite';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface IProps {
  title: string;
  path: string;
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  children: {
    title: string;
    path: string;
  }[];
}

const ListItem = ({ children, icon: Icon, path, title }: IProps) => {
  const [open, onToggle] = useToggle(true);

  const navigate = useNavigate();

  const onClickItem = (path: string) => {
    if (children.length) {
      return onToggle();
    }
    navigate(path);
  };

  return (
    <div
      onClick={() => onClickItem(path)}
      className={cn(
        'flex flex-col px-3 cursor-pointer py-1.5 hover:bg-gray-subtle rounded-sm',
      )}
    >
      <div className='flex items-center gap-2 justify-between'>
        <div className='flex items-center gap-2'>
          <Icon className='size-3.5' />
          <p className='text-sm'>{title}</p>
        </div>
        {!!children.length && (
          <IcChevron
            className={cn(
              'size-3 transition-transform  text-gray-sub-title',
              open ? 'rotate-180' : 'rotate-90',
            )}
          />
        )}
      </div>
      {!!children.length && (
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            open
              ? 'max-h-40 mt-2 overflow-auto '
              : 'max-h-0 overflow-hidden ',
          )}
        >
          <ul className='space-y-1 flex flex-col'>
            {children.map((child, index) => (
              <div
                key={index}
                onClick={() => onClickItem(child.path)}
                className='text-sm text-gray-sub-title hover:bg-gray-subtle rounded-sm pr-3 pl-6 py-1.5 hover:text-black cursor-pointer'
              >
                {child.title}
              </div>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const PrivateSideBar = observer(() => {
  const { pathname } = useLocation();
  return (
    <div className='sticky top-[84px]'>
      <div className='flex items-center gap-2 px-3'>
        <span className='p-1.5 bg-gray-primary/40 text-white rounded-full'>
          <IcDashboard className='size-4' />
        </span>
        <p className='font-medium text-[15px]'>Workspace</p>
      </div>
      <Link
        to={ROUTES.LANDING}
        className={cn(
          'py-1.5  rounded-sm px-3 mt-4 flex items-center gap-2',
          pathname === ROUTES.LANDING
            ? 'bg-gray-default/60'
            : 'hover:bg-gray-subtle',
        )}
      >
        <IcFolder className='size-[20px] text-gray-sub-title' />
        <p className='text-sm'>All sites</p>
      </Link>
      <div className='py-4'>
        <p className=' text-gray-sub-title font-medium text-sm'>
          Settings
        </p>
        <nav className='py-3'>
          <ul className='space-y-1'>
            {PRIVATE_SETTING_MENU.map((item, index) => {
              return <ListItem key={index} {...item} />;
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
});

PrivateSideBar.displayName = 'Private Side Bar';

export { PrivateSideBar };
