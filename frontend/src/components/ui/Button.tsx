import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2';

  const variants = {
    primary: 'btn-premium text-white shadow-lg shadow-primary/20',
    secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm',
    outline: 'border border-white/20 text-white hover:bg-white/5 backdrop-blur-sm',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
