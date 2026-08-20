import { Skeleton, SkeletonLine } from '@/components/Skeleton';

export default function ProfileLoading() {
  return (
    <div>
      <SkeletonLine width="7rem" height={30} className="mb-2" />
      <SkeletonLine width="12rem" height={14} className="mb-5" />

      <div className="glass mb-4 p-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-4 last:mb-0">
            <SkeletonLine width="6rem" height={12} className="mb-2" />
            <Skeleton style={{ height: 48 }} />
          </div>
        ))}
      </div>

      <Skeleton style={{ height: 48 }} className="rounded-full" />
    </div>
  );
}
