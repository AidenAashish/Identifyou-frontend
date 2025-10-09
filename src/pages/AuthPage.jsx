import { useState, useEffect } from "react";
import Signin from "../components/Signin";
import Signup from "../components/Signup";
import { getEncryptedItem, removeEncryptedItem } from "../utils/encryption.js";
import axios from "axios";
import { useUser, useStackApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";
import { setEncryptedItem } from "../utils/encryption.js";

export default function AuthPage() {
  const app = useStackApp();
  const user = useUser({ or: 'return-null' });
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(getEncryptedItem("name") || "User");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
    setUsername(getEncryptedItem("name") || "User");
    
    // Check if user is authenticated and handle onboarding
    if (user) {
      checkOnboardingStatus(user);
    }
  }, [user, navigate]);

  const checkOnboardingStatus = async (user) => {
    if (!user) return;

    const onboardingCompleted = false; // Stack doesn't have user_metadata, handle differently
    const isNewSignup = getEncryptedItem("is_new_signup") === "true";
    const isOAuthSignup = getEncryptedItem("is_oauth_signup") === "true";

    let userExistsInDB = false;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users/${user.id}`
      );
      userExistsInDB = res.status === 200 && res.data;
      console.log("🔍 User database check:", userExistsInDB ? "Found" : "Not found");
    } catch (err) {
      userExistsInDB = false;
      console.log("🔍 User database check: Not found (API error)");
    }
    
    // Also detect OAuth users by checking if they don't exist in our DB
    // This handles cases where user comes back or localStorage was cleared
    const isPotentialOAuthUser = !userExistsInDB && !isNewSignup;
    
    const isNewUser = isNewSignup || isOAuthSignup || (!userExistsInDB);

    // Create user profile if they don't exist in DB
    if (!userExistsInDB) {
      try {
        let username;
        
        if (isOAuthSignup || isPotentialOAuthUser) {
          // For OAuth users, try to get name from user object
          username = 
            user.displayName || // Stack's display name for OAuth users
            user.primaryEmail?.split("@")[0] ||
            "User";
          console.log("🔑 Creating OAuth user profile with username:", username);
        } else {
          // For regular signup users, prefer the form data
          username = 
            getEncryptedItem("name") || // From signup form
            user.displayName ||
            user.primaryEmail?.split("@")[0] ||
            "User";
          console.log("📝 Creating regular signup user profile with username:", username);
        }

        await Promise.all([
          axios.post(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users`,
            {
              authId: user.id,
              username: username,
              email: user.primaryEmail,
              persona: "YOUNG_TEEN",
            }
          ),
        ]);
        console.log("✅ User profile created successfully for", 
          (isOAuthSignup || isPotentialOAuthUser) ? "OAuth user" : "regular user");
      } catch (error) {
        console.error("❌ Error creating user profile:", error);
      }
    } else {
      console.log("ℹ️ User already exists in database:", user.primaryEmail);
    }

    // Redirect
    if (!onboardingCompleted && isNewUser) {
      // Clean up signup flags
      removeEncryptedItem("is_new_signup");
      removeEncryptedItem("is_oauth_signup");
      removeEncryptedItem("name"); // Clean up stored name from forms
      console.log("🚀 Redirecting new user to questionnaire");
      window.location.href = "/questionnaire";
    } else {
      // Clean up flags for existing users too
      removeEncryptedItem("is_new_signup");
      removeEncryptedItem("is_oauth_signup");
      removeEncryptedItem("name");
      console.log("🏠 Redirecting existing user to chat");
      window.location.href = "/chat";
    }
  };

  const signUpWithGoogle = async () => {
    try {
      // Mark this as an OAuth signup/signin to handle it properly in checkOnboardingStatus
      setEncryptedItem("is_oauth_signup", "true");
      await app.signInWithOAuth("google");
    } catch (error) {
      console.error("❌ OAuth signup/signin error:", error);
      removeEncryptedItem("is_oauth_signup");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen z-40 bg-gradient-to-br from-gray-900 via-blue-900/80 to-gray-900 backdrop-blur-sm bg-black/60 animate-fadeIn">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-purple-600/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/3 w-20 h-20 sm:w-24 sm:h-24 bg-purple-400/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="mb-6 relative z-10 flex justify-center items-center pt-8">
          <div className="bg-gray-800/60 backdrop-blur-lg py-4 px-8 rounded-xl shadow-2xl border border-gray-300/50">
            <div className="flex justify-center items-center ">
              <button onClick={() => navigate("/")}>
                <img src="/logo.png" alt="Logo" className="h-10" />
              </button>
            </div>
          </div>
        </div>

        <main className="relative flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
          <div className="w-full max-w-md space-y-8">
            {/* Toggle buttons */}
            <div className="flex bg-gray-800/50 backdrop-blur-lg rounded-2xl p-2 border border-purple-500/20">
              <button
                onClick={() => app.redirectToSignIn()}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  isSigningIn
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSigningIn(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  !isSigningIn
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="animate-fadeIn">
              {isSigningIn ? (
                <Signin setIsSigningIn={setIsSigningIn} />
              ) : (
                <Signup setIsSigningIn={setIsSigningIn} />
              )}
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-400 bg-gray-900">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={signUpWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border border-gray-200 cursor-pointer"
            >
              <img
                src="/google-color.svg"
                alt="Google Logo"
                className="w-5 h-5 mt-[2px]"
              />
              Sign in with Google
            </button>
          </div>
        </main>
      </div>
    );
  } else {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-green-500 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold">Welcome, {username}</h2>
          <p className="text-gray-300">You are now signed in!</p>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            onClick={() => window.location.href = "/questionnaire"}
          >
            Answer Onboarding Questions
          </button>
        </div>
      </div>
    );
  }
}
