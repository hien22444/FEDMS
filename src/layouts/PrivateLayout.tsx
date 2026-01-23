import { Outlet } from 'react-router-dom';
import { PrivateHeader } from './PrivateHeader';
import { PrivateSideBar } from './PrivateSideBar';

export const PrivateLayout = () => {
  return (
    <main className=''>
      <PrivateHeader />
      <section className='max-w-heading flex'>
        <div className='min-w-[240px] pt-6'>
          <PrivateSideBar />
        </div>
        <section className='flex-1 px-4'>
          <Outlet />
        </section>
      </section>
    </main>
  );
};
