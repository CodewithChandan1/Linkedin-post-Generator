export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 rounded shimmer" />
          <div className="h-2.5 w-56 rounded shimmer" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-11/12 rounded shimmer" />
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-4/5 rounded shimmer" />
        <div className="h-3 w-2/3 rounded shimmer" />
      </div>
    </div>
  );
}
