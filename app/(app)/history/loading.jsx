import { SkeletonLine } from '@/components/Skeleton';

export default function HistoryLoading() {
  return (
    <div>
      <SkeletonLine width="7rem" height={30} className="mb-2" />
      <SkeletonLine width="16rem" height={14} className="mb-5" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <SkeletonLine width="50%" height={16} className="mb-2" />
              <SkeletonLine width="30%" height={12} />
            </div>
            <div className="shrink-0 text-right">
              <SkeletonLine width="3rem" height={18} className="mb-2 ml-auto" />
              <SkeletonLine width="2rem" height={11} className="ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
