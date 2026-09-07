import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-kz-border rounded ${className}`} 
      {...props}
    />
  );
};
