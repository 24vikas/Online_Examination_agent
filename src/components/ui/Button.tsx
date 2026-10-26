import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  // Base sizing maintaining 44px minimum touch targets
  const sizeClasses = {
    sm: 'min-h-[40px] px-3.5 py-2 text-xs',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-base',
  }[size];

  // Deep green university examination palette:
  // Primary: deep green #1F4D3F with crisp white text
  // Secondary: white with deep green outline
  // Ghost: text only with soft tint hover
  // Danger: red outline
  const variantClasses = {
    primary:
      'bg-[#1F4D3F] text-white font-semibold hover:bg-[#173B30] border border-transparent shadow-[0_1px_2px_rgba(16,37,31,0.06)] disabled:bg-[#1F4D3F]/50 disabled:cursor-not-allowed',
    secondary:
      'border border-[#1F4D3F] text-[#1F4D3F] bg-white hover:bg-[#F6F9F6] font-medium disabled:opacity-50 disabled:cursor-not-allowed',
    ghost:
      'text-[#1F4D3F] hover:bg-[#D6EBDD]/40 font-medium disabled:opacity-40 disabled:cursor-not-allowed',
    danger:
      'border border-[#B91C1C] text-[#B91C1C] bg-white hover:bg-[#FEE2E2] font-medium disabled:opacity-50 disabled:cursor-not-allowed',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] transition-colors cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3F] focus-visible:ring-offset-2 ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
