import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-[16px] border border-[#E3EAE6] p-6 shadow-[0_1px_2px_rgba(16,37,31,0.06)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
