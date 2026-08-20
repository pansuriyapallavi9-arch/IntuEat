import { Skeleton, SkeletonLine, SkeletonCircle } from '@/components/Skeleton';

export default function WaterLoading() {
  return (
    <div>
      <SkeletonLine width="6rem" height={30} className="mb-2" />
      <SkeletonLine width="15rem" height={14} className="mb-5" />

      <div className="glass flex flex-col items-center p-6">
        <SkeletonCircle size={160} />
        <SkeletonLine width="8rem" height={16} className="mt-4" />
        <div className="mt-6 flex w-full items-center justify-center gap-4">
          <Skeleton className="rounded-full" style={{ width: 56, height: 56 }} />
          <Skeleton className="rounded-full" style={{ width: 56, height: 56 }} />
        </div>
      </div>
    </div>
  );
}
