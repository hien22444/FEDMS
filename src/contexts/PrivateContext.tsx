/* eslint-disable react-refresh/only-export-components */
import React, { useContext } from 'react';

interface IProps {
  children: React.ReactNode;
}

interface IContextState {
  value?: string; // Add states and setState functions here to pass down to child components
}

const PrivateContext = React.createContext<IContextState | null>(
  null,
);

export function PrivateProvider(props: IProps) {
  const { children } = props;

  return (
    <PrivateContext.Provider
      value={
        {
          // setStore,
          // store,
          // setPropertiesSelected,
          // propertiesSelected,
        }
      }
    >
      {children}
    </PrivateContext.Provider>
  );
}

export function usePrivateContext() {
  const context = useContext(PrivateContext);
  if (!context) {
    throw new Error('Private Context Failed');
  }
  return context;
}
