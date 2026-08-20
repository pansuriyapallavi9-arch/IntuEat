import { Skeleton, SkeletonLine, SkeletonCircle } from '@/components/Skeleton';

export default function DashboardLoading() {
  return (
    <div>
      {/* Greeting */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <SkeletonLine width="8rem" height={14} className="mb-2" />
          <SkeletonLine width="11rem" height={30} />
        </div>
        <Skeleton className="rounded-full" style={{ width: 70, height: 40 }} />
      </div>

      {/* Calorie hero */}
      <div className="glass mb-4 flex items-center gap-5 p-5">
        <SkeletonCircle size={128} />
        <div className="flex-1">
          <SkeletonLine width="6rem" height={14} className="mb-3" />
          <SkeletonLine width="9rem" height={24} className="mb-2" />
          <SkeletonLine width="7rem" height={14} />
        </div>
      </div>

      {/* Macro rings */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass flex flex-col items-center p-4">
            <SkeletonCircle size={76} />
            <SkeletonLine width="3.5rem" height={12} className="mt-3" />
            <SkeletonLine width="2.5rem" height={11} className="mt-1.5" />
          </div>
        ))}
      </div>

      {/* Week trend */}
      <div className="glass mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <SkeletonLine width="6rem" height={16} />
          <SkeletonLine width="4.5rem" height={14} />
        </div>
        <Skeleton style={{ height: 110 }} />
      </div>

      {/* Water + Scan */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="glass p-4">
          <SkeletonLine width="4rem" height={14} className="mb-6" />
          <SkeletonLine width="6rem" height={22} />
        </div>
        <div className="glass p-4">
          <SkeletonLine width="5rem" height={14} className="mb-6" />
          <SkeletonLine width="5rem" height={22} />
        </div>
      </div>

      {/* Today's meals */}
      <SkeletonLine width="8rem" height={20} className="mb-3" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <SkeletonLine width="55%" height={16} className="mb-2" />
              <SkeletonLine width="35%" height={12} />
            </div>
            <SkeletonLine width="2.5rem" height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
