import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  error,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#10251F]">
          {label} {required && <span className="text-[#B91C1C]">*</span>}
        </label>
        {helperText && !error && (
          <span className="text-[11px] text-[#5B6B66]">{helperText}</span>
        )}
      </div>

      {children}

      {error && <p className="text-xs text-[#B91C1C] font-medium">{error}</p>}
    </div>
  );
};
