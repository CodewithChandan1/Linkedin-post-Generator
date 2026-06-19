import { LinkedInLogo } from "./Icons";

export default function LinkedInConnect({ linkedin }) {
  const { isConnected, connection, daysUntilExpiry, connect, disconnect, error, clearError } = linkedin;

  if (isConnected) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          {connection.picture ? (
            <img
              src={connection.picture}
              alt=""
              className="w-9 h-9 rounded-full"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-linkedin flex items-center justify-center">
              <LinkedInLogo className="w-5 h-5 [&>path]:fill-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {connection.name || "LinkedIn Connected"}
            </p>
            <p className="text-xs text-green-600">✓ Connected</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry}d` : "Token active"}
          </p>
          <button
            onClick={disconnect}
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-700 mb-3">Connect LinkedIn for one-click posting</p>
      <button
        onClick={connect}
        className="w-full flex items-center justify-center gap-2 bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium py-2.5 rounded-full transition"
      >
        <LinkedInLogo className="w-4 h-4 [&>path]:fill-white" />
        Connect LinkedIn
      </button>
      {error && (
        <div className="mt-2 flex items-start gap-1">
          <p className="text-xs text-red-500 flex-1">{error}</p>
          <button onClick={clearError} className="text-xs text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">
        Without connection, posts open in LinkedIn's compose window instead.
      </p>
    </div>
  );
}
