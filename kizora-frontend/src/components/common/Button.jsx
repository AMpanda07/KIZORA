import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-kz-primary focus:ring-offset-2 focus:ring-offset-kz-bg disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-kz-primary text-white hover:bg-blue-600',
    secondary: 'bg-kz-secondary text-white hover:bg-emerald-600',
    danger: 'bg-kz-danger text-white hover:bg-red-600',
    outline: 'border border-kz-border text-kz-text hover:bg-kz-surface',
    ghost: 'text-kz-text hover:bg-kz-surface hover:text-white',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
    icon: 'p-2',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
