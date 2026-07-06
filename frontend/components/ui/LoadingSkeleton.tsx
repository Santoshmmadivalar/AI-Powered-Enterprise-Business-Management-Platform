import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse bg-secondary/50 rounded-2xl border border-border/20 p-6 h-64 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="h-12 w-12 rounded-lg bg-muted/60" />
        <div className="h-6 w-3/4 rounded bg-muted/60" />
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-5/6 rounded bg-muted/60" />
      </div>
      <div className="h-4 w-1/4 rounded bg-muted/60 mt-4" />
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-12">
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-muted/60" />
        <div className="h-10 w-2/3 rounded bg-muted/80" />
        <div className="h-4 w-1/2 rounded bg-muted/60" />
      </div>
      <div className="h-[400px] w-full rounded-2xl bg-secondary/50" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="h-6 w-1/4 rounded bg-muted/80" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted/60" />
            <div className="h-4 w-full rounded bg-muted/60" />
            <div className="h-4 w-5/6 rounded bg-muted/60" />
          </div>
        </div>
        <div className="space-y-4 bg-secondary/50 p-6 rounded-2xl">
          <div className="h-6 w-1/2 rounded bg-muted/80" />
          <div className="h-4 w-full rounded bg-muted/60" />
          <div className="h-4 w-3/4 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
};
