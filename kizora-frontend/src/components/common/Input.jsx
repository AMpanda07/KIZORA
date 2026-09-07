import React from 'react';
import { Search } from 'lucide-react';

export const Input = React.forwardRef(({ 
  className = '', 
  icon,
  ...props 
}, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-kz-muted">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={`w-full bg-kz-surface border border-kz-border rounded text-kz-text placeholder-kz-muted focus:outline-none focus:border-kz-primary focus:ring-1 focus:ring-kz-primary transition-colors py-2 px-4 ${icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';
