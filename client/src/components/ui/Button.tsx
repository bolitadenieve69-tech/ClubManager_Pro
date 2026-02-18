import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'size'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary-600 text-white shadow-lg shadow-primary-900/20 hover:bg-primary-700 border border-primary-500/20',
            secondary: 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50',
            danger: 'bg-rose-600 text-white shadow-lg shadow-rose-900/20 hover:bg-rose-700',
            ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
            glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs font-black tracking-widest',
            md: 'px-6 py-3 text-sm font-black tracking-widest',
            lg: 'px-8 py-4 text-base font-black tracking-widest'
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={disabled || loading}
                className={cn(
                    'inline-flex items-center justify-center rounded-button transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!loading && icon && <span className="mr-2">{icon}</span>}
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
