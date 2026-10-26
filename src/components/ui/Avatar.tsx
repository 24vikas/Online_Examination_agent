import React from 'react';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  }[size];

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover border border-[#E3EAE6] ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#D6EBDD] text-[#1F4D3F] font-semibold flex items-center justify-center border border-[#1F4D3F]/20 select-none ${sizeClasses} ${className}`}
      title={name}
    >
      {initials || 'U'}
    </div>
  );
};
