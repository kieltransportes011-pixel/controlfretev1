import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
        />
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-2 w-12" />
            </div>
        </div>
    );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            ))}
        </div>
    );
};
