import { LinkedInLogo } from "@/components/Icons/Icons";
import { Check } from "lucide-react";

export default function LinkedInConnect({ linkedin }) {
  const { isConnected, connection, daysUntilExpiry, connect, disconnect, error, clearError } = linkedin;

  if (isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-3.5 mb-4">
          {connection.picture ? (
            <img
              src={connection.picture}
              alt=""
              className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-linkedin flex items-center justify-center border border-linkedin/10 shadow-sm">
              <LinkedInLogo size={18} color="white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">
              {connection.name || "LinkedIn Connected"}
            </p>
            <p className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-bold mt-0.5">
              <Check size={10} className="stroke-[3]" /> CONNECTED
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry}d` : "Token active"}
          </p>
          <button
            onClick={disconnect}
            className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-100 px-2.5 py-1 rounded-full transition-all"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="text-xs text-gray-600 leading-relaxed mb-4">Connect your LinkedIn profile for automated 1-click publishing.</p>
      <button
        onClick={connect}
        className="w-full flex items-center justify-center gap-2 bg-linkedin hover:bg-linkedin-hover text-white text-xs font-bold py-3 rounded-full transition shadow-sm hover:shadow active:scale-[0.99]"
      >
        <LinkedInLogo size={15} color="white" />
        Connect LinkedIn Profile
      </button>
      {error && (
        <div className="mt-2.5 flex items-start gap-1 bg-red-50 border border-red-100 rounded-xl p-2.5">
          <p className="text-xs text-red-600 flex-1 leading-normal font-medium">{error}</p>
          <button onClick={clearError} className="text-xs text-gray-400 hover:text-gray-600 font-bold px-1">×</button>
        </div>
      )}
      <p className="text-[10px] text-gray-400 leading-normal mt-3">
        * Without connection, published posts will open in LinkedIn's compose window as a fallback.
      </p>
    </div>
  );
}
