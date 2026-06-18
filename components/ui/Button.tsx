// components/ui/Button.tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'whatsapp' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white border-bg-ink hover:bg-accent/90',
  secondary: 'bg-white text-bg-ink border-bg-ink hover:bg-accent-soft',
  danger: 'bg-danger-bg text-danger-fg border-danger-border hover:bg-danger-border/40',
  whatsapp: 'bg-whatsapp text-whatsapp-fg border-bg-ink hover:bg-whatsapp/90',
  ghost: 'bg-transparent text-bg-ink border-transparent hover:bg-black/5',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, disabled, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`touch-target inline-flex items-center justify-center gap-2 rounded-pill border-2 font-display font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
