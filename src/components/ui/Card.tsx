import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, padding = 'md', className = '', ...props }) => {
  const paddingClasses: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white border border-[#E1E5E3] rounded-lg shadow-xs ${paddingClasses[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
