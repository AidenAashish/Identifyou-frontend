import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, CheckCircle, User } from "lucide-react";
import { setEncryptedItem } from "../utils/encryption.js";
import { stackClientApp } from "../stackframe/stack";
import axios from "axios";

export default function Signup({ setIsSigningIn }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setError("");

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      // Server expects minimum length 8
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);
      const result = await stackClientApp.signUpWithCredential({
        email,
        password,
      });

      console.log("Signup result:", result);

      if (result?.status === "error") {
        // Convert KnownError / Error objects to a readable string to avoid React rendering issues
        const message =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || String(result.error);
        setError(message);
        setLoading(false);
        return;
      }

      // Mark in localStorage that this is a new signup and store username
      setEncryptedItem("is_new_signup", "true");
      setEncryptedItem("name", username);
      
      // Try multiple strategies to get user ID and create profile immediately
      let userCreated = false;
      
      try {
        console.log("Strategy 1: Trying to get current user immediately after signup...");
        const currentUser = await stackClientApp.getUser({ or: 'return-null' });
        
        if (currentUser?.id) {
          console.log("✅ Got user immediately:", currentUser.id);
          await createUserProfile(currentUser.id, username, email);
          userCreated = true;
          setProfileCreated(true);
        }
      } catch (error) {
        console.log("Strategy 1 failed:", error.message);
      }

      if (!userCreated) {
        try {
          console.log("Strategy 2: Attempting immediate sign-in after signup...");
          const signInResult = await stackClientApp.signInWithCredential({
            email,
            password,
            noRedirect: true,
          });

          if (signInResult?.status === "ok") {
            const currentUser = await stackClientApp.getUser({ or: 'return-null' });
            
            if (currentUser?.id) {
              console.log("✅ Got user after immediate sign-in:", currentUser.id);
              await createUserProfile(currentUser.id, username, email);
              userCreated = true;
              setProfileCreated(true);
            }
          }
        } catch (error) {
          console.log("Strategy 2 failed:", error.message);
        }
      }

      if (!userCreated) {
        console.log("⚠️ Immediate profile creation not possible, will happen after email verification");
      }
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Failed to sign up. Please try again.");
      setLoading(false);
      console.error("Signup error:", err);
    }
  };

  const createUserProfile = async (authId, username, email) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    console.log("Creating user profile at:", `${apiUrl}/users`);
    console.log("User data:", {
      authId,
      username,
      email,
      persona: "YOUNG_TEEN",
    });

    const [response] = await Promise.all([
      axios.post(`${apiUrl}/users`, {
        authId,
        username,
        email,
        persona: "YOUNG_TEEN",
      }),
    ]);
    
    console.log("✅ User profile created successfully:", response.data);
    return response.data;
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (!password) return { strength: 0, label: "", color: "" };
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { strength: 1, label: "Weak", color: "bg-red-500" };
      case 2:
        return { strength: 2, label: "Fair", color: "bg-yellow-500" };
      case 3:
        return { strength: 3, label: "Good", color: "bg-blue-500" };
      case 4:
        return { strength: 4, label: "Strong", color: "bg-green-500" };
      default:
        return { strength: 0, label: "", color: "" };
    }
  };

  const passwordStrength = getPasswordStrength();

  if (success) {
    return (
      <div className="w-full p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-500/30 animate-fadeIn">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {profileCreated ? "Account Created!" : "Check Your Email!"}
          </h2>
          <p className="text-gray-300 leading-relaxed">
            {profileCreated ? (
              <>
                Your account has been created successfully! We've sent a verification link to{" "}
                <span className="font-medium text-purple-400">{email}</span>.
                <br />
                <span className="text-green-400 text-sm mt-2 block">✅ Profile saved to database</span>
              </>
            ) : (
              <>
                We've sent a verification link to{" "}
                <span className="font-medium text-purple-400">{email}</span>.
                <br />
                <span className="text-yellow-400 text-sm mt-2 block">⏳ Profile will be saved after verification</span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/20 animate-fadeIn relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-300">Join our community today</p>
      </div>

      <form onSubmit={handleSignUp} autoComplete="off" className="space-y-5">
        {/* Username Input */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/50"
            required
          />
        </div>

        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-500/50"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              autoComplete="off"
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
          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="mt-3 space-y-2 animate-fadeIn">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Password strength</span>
                <span
                  className={`font-medium ${
                    passwordStrength.strength <= 1
                      ? "text-red-400"
                      : passwordStrength.strength === 2
                        ? "text-yellow-400"
                        : passwordStrength.strength === 3
                          ? "text-blue-400"
                          : "text-green-400"
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            autoComplete="off"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-12 pr-12 py-4 bg-gray-700/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
              confirmPassword && password !== confirmPassword
                ? "border-red-500/50"
                : confirmPassword && password === confirmPassword
                  ? "border-green-500/50"
                  : "border-gray-600/50"
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-200"
            aria-label={
              showConfirmPassword
                ? "Hide password confirmation"
                : "Show password confirmation"
            }
          >
            {showConfirmPassword ? (
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

        {/* Sign Up Button */}
        <button
          type="submit"
          disabled={
            loading || !email || !password || password !== confirmPassword
          }
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/30 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Toggle to Sign In */}
      <div className="text-center mt-6">
        <p className="text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => setIsSigningIn(true)}
            className="font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-200 focus:outline-none cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
