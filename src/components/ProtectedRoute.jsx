import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const timeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const checkSession = async () => {
    try {
      console.log("🔐 Checking session...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (error) {
        console.error("❌ Session check error:", error);
        setError(error.message);
        setSession(null);
        setLoading(false);
        return;
      }

      console.log("✅ Session check result:", session ? "Authenticated" : "Not authenticated");
      setSession(session);
      setLoading(false);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      console.error("❌ Session check failed:", err);
      
      // Clear timeout on error too
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setError(err.message);
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 Retrying session check (${retryCountRef.current}/${maxRetries})...`);
        setTimeout(() => {
          checkSession();
        }, 1000 * retryCountRef.current); // Exponential backoff
      } else {
        console.error("❌ Max retries reached, stopping session check");
        setLoading(false);
        setSession(null);
      }
    }
  };

  useEffect(() => {
    console.log("🚀 ProtectedRoute mounted for path:", location.pathname);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset state
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Auth check timeout - forcing completion");
        setLoading(false);
        // Don't automatically retry on timeout, let user decide
      }
    }, 8000); // Increased to 8 seconds

    // Initial session check
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔄 Auth state changed:", event, session ? "Authenticated" : "Not authenticated");
        
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Only update state if this is a meaningful change
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setLoading(false);
          setError(null);
          retryCountRef.current = 0;
        }
      }
    );

    return () => {
      console.log("🧹 ProtectedRoute cleanup");
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [location.pathname]); // Add location.pathname to re-run on route changes

  // Force recheck if stuck loading for too long
  const handleForceRecheck = () => {
    console.log("🔄 Force recheck triggered");
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    checkSession();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen z-40 bg-gradient-to-br from-gray-900 via-blue-900/80 to-gray-900 backdrop-blur-sm bg-black/60 animate-fadeIn">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="text-white font-semibold">Checking Authentication...</p>
          
          {/* Show retry button immediately */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleForceRecheck}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              Retry Authentication Check
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen z-40 bg-gradient-to-br from-gray-900 via-red-900/80 to-gray-900 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h3 className="text-white font-semibold text-lg">Authentication Error</h3>
          <p className="text-gray-300 text-sm">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={handleForceRecheck}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              Retry
            </button>
            <button
              onClick={() => {
                setSession(null);
                setLoading(false);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />; 
  }

  return children;
}