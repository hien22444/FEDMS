import { cn } from '@/utils';
import { Button as ButtonAnt } from 'antd';
import React, { forwardRef } from 'react';

const variants = {
  default:
    'bg-primary text-white border-none  rounded-[4px] focus:!bg-primary hover:bg-primary-darker',

  outline:
    'text-sm rounded-[4px] hover:text-primary  disabled:hover:text-gray-300',
  danger:
    'bg-red-600 text-white border-none rounded-[4px] hover:bg-red-700 focus:!bg-red-700',
  text: 'text-sm hover:text-primary bg-transparent border-none shadow-none',
};

const sizes = {
  small: 'h-9 px-3.5 font-sans',
  large: 'h-12 px-5 font-medium',
};

export const Button = forwardRef(
  (
    {
      children,
      variant = 'default',
      size = 'small',
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <ButtonAnt
        ref={ref}
        className={cn(variants[variant], sizes[size], className)}
        {...rest}
      >
        {children}
      </ButtonAnt>
    );
  },
);

Button.displayName = 'Button Unix';
