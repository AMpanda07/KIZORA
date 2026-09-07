import React from 'react';

export const AnimeCardSkeleton = ({ variant = 'default' }) => {
  if (variant === 'horizontal') {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="skeleton w-12 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="skeleton h-3.5 w-3/4 rounded" />
          <div className="skeleton h-2.5 w-1/3 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'continue-watching') {
    return (
      <div className="flex flex-col rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="skeleton w-full aspect-video" />
        <div className="p-3 flex flex-col gap-2">
          <div className="skeleton h-3.5 w-3/4 rounded" />
          <div className="skeleton h-2.5 w-1/2 rounded" />
          <div className="skeleton h-1.5 w-full rounded-full mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="skeleton w-full aspect-[3/4]" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-2.5 w-1/3 rounded" />
          <div className="skeleton h-2.5 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
};

export const AnimeGridSkeleton = ({ count = 12, variant = 'default' }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="w-full h-72 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] relative p-6 sm:p-10 flex flex-col justify-end">
      <div className="skeleton h-5 w-24 rounded-full mb-3" />
      <div className="skeleton h-8 sm:h-12 w-3/4 max-w-lg rounded-xl mb-4" />
      <div className="skeleton h-3 w-1/2 max-w-md rounded mb-2" />
      <div className="skeleton h-3 w-1/3 max-w-sm rounded mb-6" />
      <div className="flex gap-3">
        <div className="skeleton h-10 w-32 rounded-lg" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
};

export const DetailsSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="skeleton w-48 sm:w-64 aspect-[3/4] rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-4 w-full">
          <div className="skeleton h-8 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-16 rounded-md" />
            <div className="skeleton h-6 w-16 rounded-md" />
            <div className="skeleton h-6 w-16 rounded-md" />
          </div>
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="flex gap-4 pt-2">
            <div className="skeleton h-11 w-36 rounded-lg" />
            <div className="skeleton h-11 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
