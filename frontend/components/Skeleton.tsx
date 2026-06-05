"use client";

interface SkeletonProps {
  className?: string;
}

/* ─── Base shimmer block ─────────────────────────────────────────────────── */
export function SkeletonBlock({ className = "" }: SkeletonProps) {
  return <div className={`skeleton bg-gray-800/60 ${className}`} />;
}

/* ─── Single text line ───────────────────────────────────────────────────── */
export function SkeletonLine({ width = "w-full", className = "" }: { width?: string; className?: string }) {
  return <SkeletonBlock className={`h-3 ${width} ${className}`} />;
}

/* ─── Stat card skeleton ─────────────────────────────────────────────────── */
export function SkeletonStatCard() {
  return (
    <div className="p-5 border-2 border-gray-800 bg-gray-900/40 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <SkeletonBlock className="w-5 h-5" />
      </div>
      <SkeletonBlock className="h-8 w-16 mb-2" />
      <SkeletonLine width="w-24" className="mb-1" />
      <SkeletonLine width="w-16" />
    </div>
  );
}

/* ─── Debate list card skeleton ──────────────────────────────────────────── */
export function SkeletonDebateCard() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-black/30">
      <SkeletonBlock className="w-7 h-7 shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-4/5" />
        <SkeletonLine width="w-24" />
      </div>
      <SkeletonBlock className="w-12 h-5 shrink-0" />
    </div>
  );
}

/* ─── History grid card skeleton ─────────────────────────────────────────── */
export function SkeletonHistoryCard() {
  return (
    <div className="bg-gray-950 border-4 border-black p-6 space-y-4 relative overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-1/2" />
        </div>
      </div>
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-5/6" />
      <div className="flex justify-between items-center pt-2">
        <SkeletonBlock className="w-20 h-5" />
        <SkeletonBlock className="w-16 h-5" />
      </div>
    </div>
  );
}

/* ─── Template card skeleton ─────────────────────────────────────────────── */
export function SkeletonTemplateCard() {
  return (
    <div className="p-6 border-r border-black/30 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="w-5 h-5" />
        <SkeletonLine width="w-24" />
      </div>
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-4/5" />
    </div>
  );
}
