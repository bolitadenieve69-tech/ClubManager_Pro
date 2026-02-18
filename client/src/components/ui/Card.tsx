import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    variant?: 'default' | 'glass' | 'glass-dark';
}

export const Card = ({ children, className, variant = 'default', ...props }: CardProps) => {
    const variants = {
        default: "bg-white border-slate-100",
        glass: "glass",
        "glass-dark": "glass-dark text-white"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "rounded-card border shadow-premium overflow-hidden transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

Card.Header = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 border-b border-slate-50/10", className)} {...props}>
        {children}
    </div>
);

Card.Body = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6", className)} {...props}>
        {children}
    </div>
);

Card.Footer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 bg-slate-50/5 flex items-center border-t border-slate-50/10", className)} {...props}>
        {children}
    </div>
);
