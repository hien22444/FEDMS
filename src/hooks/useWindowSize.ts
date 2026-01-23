import { useEffect, useState } from 'react';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      handleResize();

      window.addEventListener('resize', handleResize);
      window.addEventListener('load', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('load', handleResize);
      };
    }
  }, []);

  return windowSize;
};
