// components/ui/Card.tsx
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dashed' | 'flat';
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const borderStyle = variant === 'dashed' ? 'border-dashed' : 'border-solid';
  const shadow = variant === 'flat' ? '' : 'shadow-chunky';

  return (
    <div
      className={`rounded-card border-2 border-bg-ink bg-white ${borderStyle} ${shadow} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
