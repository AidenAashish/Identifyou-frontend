import React, { useEffect, useState } from 'react'

function ErrorDisplay({ error, onClearError }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for fade out animation to complete before clearing
        setTimeout(() => {
          if (onClearError) {
            onClearError();
          }
        }, 300); // Match animation duration
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [error, onClearError]);

  if (!error) return null;

  return (
    <div 
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0 animate-slideDown' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-2xl border border-red-400/50 max-w-md text-center">
        <div className="flex items-center justify-center space-x-2">
          <img src={"/caution-sign.png"} alt="Caution sign" className="w-4 h-4" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                if (onClearError) {
                  onClearError();
                }
              }, 300);
            }}
            className="ml-2 text-red-200 hover:text-white transition-colors duration-200 text-lg font-bold leading-none"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay