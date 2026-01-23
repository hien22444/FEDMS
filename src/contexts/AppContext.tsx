/* eslint-disable react-refresh/only-export-components */

import React, { use } from 'react';
import { Outlet } from 'react-router-dom';

const AppContext = React.createContext<null>(null);

export function AppProvider() {
  return (
    <AppContext value={null}>
      <Outlet />
    </AppContext>
  );
}

export function useAppContext() {
  const context = use(AppContext);
  if (!context) {
    throw new Error('App Context Failed');
  }
  return context;
}
