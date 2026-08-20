import { Skeleton, SkeletonLine } from '@/components/Skeleton';

export default function SuggestionsLoading() {
  return (
    <div>
      <SkeletonLine width="8rem" height={30} className="mb-2" />
      <SkeletonLine width="18rem" height={14} className="mb-5" />

      {/* Mode tabs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass p-4">
            <Skeleton className="mb-3 rounded-full" style={{ width: 40, height: 40 }} />
            <SkeletonLine width="6rem" height={16} className="mb-2" />
            <SkeletonLine width="9rem" height={12} />
          </div>
        ))}
      </div>

      <div className="glass p-5">
        <SkeletonLine width="70%" height={14} className="mb-3" />
        <SkeletonLine width="90%" height={14} className="mb-3" />
        <SkeletonLine width="60%" height={14} />
      </div>
    </div>
  );
}
