/* eslint-disable react-refresh/only-export-components */
import React, { useContext } from 'react';

const PrivateContext = React.createContext(null);

export function PrivateProvider(props) {
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
