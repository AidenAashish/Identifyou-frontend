import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/react";

const NotFoundErrorPage = () => {
  const navigate = useNavigate();
  const user = useUser({ or: 'return-null' });

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

      {/* Logo header */}
      <div className="mb-6 relative z-10 flex justify-center items-center pt-8">
        <div className="bg-gray-800/60 backdrop-blur-lg py-4 px-8 rounded-xl shadow-2xl border border-gray-300/50">
          <div className="flex justify-center items-center">
            <button onClick={() => navigate("/")}>
              <img src="/logo.png" alt="Logo" className="h-10" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
        <div className="w-full max-w-2xl text-center space-y-8">
          {/* 404 Number with gradient */}
          <div className="relative">
            <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 bg-clip-text text-transparent animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-purple-500/5 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Message card */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-purple-500/20 shadow-2xl animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
              Page Not Found
            </h2>
            <p className="text-gray-300 text-base sm:text-lg mb-6">
              Oops! The page you're looking for seems to have wandered off into
              the digital void.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto bg-gray-700/50 hover:bg-gray-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-600/50"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Floating elements */}
          <div className="flex justify-center gap-4 sm:gap-6 text-gray-400 text-sm">
            <button
              onClick={() => navigate("/chat")}
              className="hover:text-purple-400 transition-colors duration-300"
            >
              Chat
            </button>
            {!user && (
                <>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={() => navigate("/auth")}
                    className="hover:text-purple-400 transition-colors duration-300"
                  >
                    Sign In
                  </button>
                </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default NotFoundErrorPage;