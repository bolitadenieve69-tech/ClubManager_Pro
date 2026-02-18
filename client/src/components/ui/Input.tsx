import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none",
                            icon && "pl-12",
                            error && "border-rose-500 focus:ring-rose-500",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-medium text-rose-500 px-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
