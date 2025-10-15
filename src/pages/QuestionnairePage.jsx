import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import OnboardingQuestionnaire from "../components/OnboardingQuestionnaire";
import { useUser } from "@stackframe/react";
import axios from "axios";

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const user = useUser({ or: "return-null" });
  const loadingUser = user === undefined;

  const [questionnaire, setQuestionnaire] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === undefined) return; // wait until user resolves

    if (!user) {
      console.log("❌ No user found, redirecting to /auth");
      navigate("/auth", { replace: true });
      return;
    }

    const initQuestionnaire = async () => {
      try {
        console.log("🔄 Initializing questionnaire for user:", user.id);

        // 1️⃣ Create or validate user response
        await axios.post(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/questionnaire/responses/create`,
          {
            userId: user.id,
            questionnaireId: "9995408e-8b2e-48a5-bbca-8a67669d755c",
          }
        );

        // 2️⃣ Fetch questionnaire questions
        const questionsRes = await axios.get(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/questionnaire/questions/${user.id}`
        );

        console.log("✅ Questionnaire fetched:", questionsRes.data);
        setQuestionnaire(questionsRes.data);
      } catch (err) {
        console.error("❌ Error initializing questionnaire:", err);

        if (
          err.response?.data?.error ===
            "Questionnaire already completed for this user" ||
          err.response?.status === 409
        ) {
          console.log("⚠️ Questionnaire already completed. Redirecting to /chat");
          navigate("/chat", { replace: true });
          return;
        }

        setError("Failed to load questionnaire. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    initQuestionnaire();
  }, [user, navigate]);

  const handleComplete = () => {
    navigate("/chat", { replace: true });
  };

  // 🌀 Global loader while initializing
  if (loadingUser || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Questionnaire...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Error screen
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

  // ✅ Render questionnaire
  return (
    <OnboardingQuestionnaire
      user={user}
      questionnaire={questionnaire}
      onComplete={handleComplete}
    />
  );
}