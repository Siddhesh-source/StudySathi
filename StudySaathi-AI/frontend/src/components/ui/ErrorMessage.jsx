const ErrorMessage = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl">⚠️</span>
        <div className="flex-1">
          <p className="text-red-700 font-medium">Something went wrong</p>
          <p className="text-red-600 text-sm mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
