import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { stackClientApp } from "../stackframe/stack";

export default function Signin({ setIsSigningIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }
      e.preventDefault();
      setError("");

      setLoading(true);
      const result = await stackClientApp.signInWithCredential({
        email,
        password,
      });
      setLoading(false);

      if (result?.status === "error") {
        const message =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || String(result.error);
        setError(message);
        return;
      }
    } catch (err) {
      setError(
        "Failed to sign in. Please check your credentials and try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/20 animate-fadeIn relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-300">Sign in to continue your journey</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-6">
        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/50"
            required
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-gray-700/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/50"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative z-50 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-slideDown">
            <div className="flex items-center justify-center space-x-2">
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
              <button
                onClick={() => setError("")}
                className="text-red-300 hover:text-red-100 transition-colors duration-200 text-lg font-bold leading-none ml-2"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/30 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              <span>Signing In...</span>
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Toggle to Sign Up */}
      <div className="text-center mt-8">
        <p className="text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={() => setIsSigningIn(false)}
            className="font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-200 focus:outline-none cursor-pointer"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
