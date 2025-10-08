import React from "react";
import useOnlineStatus from "../utils/checkOnlineStatus";

function Header() {
  const isOnline = useOnlineStatus();

  function getStatusIndicator() {
    if (isOnline) {
      return (
        <div className="relative hidden lg:flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-700/50">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full absolute animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">Online</span>
        </div>
      );
    } else {
      return (
        <div className="relative hidden lg:flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-700/50">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full absolute animate-pulse"></div>
          <span className="text-xs text-red-400 font-medium">Offline</span>
        </div>
      );
    }
  }

  return (
    <header className="relative flex items-center justify-between p-2 sm:p-4 bg-gradient-to-br from-gray-900 via-blue-900/90 to-gray-800 text-white shadow-2xl border-b border-purple-500/20 flex-shrink-0">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-purple-600/10 animate-pulse"></div>

      <div className="relative flex items-center space-x-2 sm:space-x-4">
        {/* Logo with fallback icon */}
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-8 sm:h-10 transition-all duration-300 hover:scale-110"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="hidden w-8 sm:w-10 h-8 sm:h-10 bg-purple-600 rounded-lg items-center justify-center">
            <svg
              className="w-4 sm:w-6 h-4 sm:h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-white-500 animate-pulse">
            Together We Heal
          </h1>
          <p className="text-xs text-gray-300 opacity-75 hidden sm:block">
            A safe space for those who've been hurt to be heard
          </p>
        </div>
      </div>
      {getStatusIndicator()}
      {/* Decorative elements */}
      <div
        className="absolute top-0 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute top-2 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-1 left-1/2 w-1 h-1 bg-pink-400 rounded-full animate-bounce"
        style={{ animationDelay: "1s" }}
      ></div>
    </header>
  );
}

export default Header;
