import { Skeleton, SkeletonLine } from '@/components/Skeleton';

export default function InsightsLoading() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <SkeletonLine width="1.5rem" height={20} />
        <SkeletonLine width="8rem" height={30} />
      </div>

      {/* Averages */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass p-4">
            <SkeletonLine width="4rem" height={12} className="mb-2" />
            <SkeletonLine width="3rem" height={24} />
          </div>
        ))}
      </div>

      {/* Calories chart */}
      <div className="glass mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <SkeletonLine width="9rem" height={16} />
          <SkeletonLine width="4rem" height={12} />
        </div>
        <Skeleton style={{ height: 130 }} />
      </div>

      {/* Weight */}
      <div className="glass p-5">
        <SkeletonLine width="5rem" height={16} className="mb-2" />
        <SkeletonLine width="16rem" height={12} className="mb-4" />
        <Skeleton style={{ height: 130 }} className="mb-4" />
        <Skeleton style={{ height: 48 }} className="rounded-full" />
      </div>
    </div>
  );
}
