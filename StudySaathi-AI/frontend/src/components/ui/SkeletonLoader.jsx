const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletons = {
    card: (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    ),
    row: (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ),
    text: (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    ),
    stats: (
      <div className="grid grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 text-center">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletons[type]}</div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
