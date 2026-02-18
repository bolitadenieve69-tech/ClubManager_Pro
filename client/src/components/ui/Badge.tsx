import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BadgeProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
    variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'glass';
    children?: React.ReactNode;
}

export const Badge = ({ className, variant = 'neutral', children, ...props }: BadgeProps) => {
    const variants = {
        success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        info: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
        neutral: 'bg-slate-100 text-slate-600 border-slate-200',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
    };

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.span>
    );
};
