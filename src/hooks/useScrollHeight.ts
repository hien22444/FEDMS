'use client';
import { useState, useEffect } from 'react';

export function useScrollHeight() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);

  const handleScroll = () => {
    const currentScrollTop =
      window.scrollY || document.documentElement.scrollTop;
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    setScrollY(currentScrollTop);
    setScrollHeight(totalHeight);
    setScrollTop(currentScrollTop);
    setScrollPercent((currentScrollTop / totalHeight) * 100 || 0);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    scrollY,
    scrollHeight,
    scrollTop,
    scrollPercent,
  };
}
