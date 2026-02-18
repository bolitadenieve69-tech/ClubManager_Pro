import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer",
                            error && "border-rose-500 focus:ring-rose-500",
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                {error && (
                    <p className="text-xs font-medium text-rose-500 px-1">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
