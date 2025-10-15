import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import OnboardingQuestionnaire from "../components/OnboardingQuestionnaire";
import { useUser } from "@stackframe/react";
import axios from "axios";

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const user = useUser({ or: "return-null" });
  const loading = user === undefined;
  const [hasCreatedResponse, setHasCreatedResponse] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === undefined) return; // wait until user is resolved
    if (hasCreatedResponse) return; // prevent duplicate calls

    const createUserResponse = async () => {
      try {
        if (!user) {
          console.log("❌ No user found, redirecting to /auth");
          navigate("/auth", { replace: true });
          return;
        }
        
        console.log("🔄 Creating user response...");
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/questionnaire/responses/create`,
          {
            userId: user.id,
            questionnaireId: "9995408e-8b2e-48a5-bbca-8a67669d755c",
          }
        );

        console.log("✅ User response created successfully");
        setHasCreatedResponse(true); // Only set after successful response

        if (response.status === 206) {
          console.log(
            "⚠️ Incomplete questionnaire response, user needs to complete it."
          );
        }
      } catch (err) {
        console.error("❌ Error creating user response:", err);
        if (
          err.response?.data?.error ===
            "Questionnaire already completed for this user" ||
          err.response?.status === 409
        ) {
          console.log(
            "⚠️ Questionnaire already completed, redirecting to /chat"
          );
          navigate("/chat", { replace: true });
          return;
        }
        
        // Handle other errors - show error message to user
        setError("Failed to initialize questionnaire. Please try refreshing the page.");
        console.error("Failed to create questionnaire response");
      }
    };

    createUserResponse();
  }, [user, hasCreatedResponse]);

  const handleQuestionnaireComplete = () => {
    navigate("/chat", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if questionnaire initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OnboardingQuestionnaire
        user={user}
        onComplete={handleQuestionnaireComplete}
        hasCreatedResponse={hasCreatedResponse}
      />
    </div>
  );
}
