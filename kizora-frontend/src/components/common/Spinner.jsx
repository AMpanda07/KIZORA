import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className = '', size = 24 }) => {
  return (
    <Loader2 
      size={size} 
      className={`animate-spin text-kz-primary ${className}`} 
    />
  );
};
