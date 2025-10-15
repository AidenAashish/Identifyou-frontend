import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle } from "lucide-react";
import { getEncryptedJSON, setEncryptedItem } from "../utils/encryption.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OnboardingQuestionnaire({ user, onComplete, hasCreatedResponse }) {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({}); // Store answers by question ID
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionnaire, setQuestionnaire] = useState([]);

  useEffect(() => {
    if (!hasCreatedResponse) return; // Wait until response is created
    if(!user || !user.id) {
      console.error("User ID is missing. Cannot fetch questionnaire.");
      return;
    }
    console.log("Fetching questionnaire for user ID:", user.id);
    const fetchQuestionnaire = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/questionnaire/questions/${user.id}`);
        setQuestionnaire(response.data);
        console.log("✅ Questionnaire fetched successfully:", response.data);
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionnaire();
  }, [hasCreatedResponse, user]);

  const currentQuestion = questionnaire[currentStep - 1]; // Use array index (0-based)
  const totalSteps = questionnaire.length;

  // useEffect(() => {
  //   const ExistingRecommendedRooms = getEncryptedJSON("recommendedRooms");
  //   if (ExistingRecommendedRooms && ExistingRecommendedRooms.length > 0) {
  //     console.log(
  //       "✅ Recommended rooms already exist:",
  //       ExistingRecommendedRooms
  //     );
  //     navigate("/chat");
  //     return;
  //   }
  // }, []);

  const handleInputChange = (questionId, optionId, isMultiSelect) => {
    if (isMultiSelect) {
      // Handle multi-select
      const currentValues = answers[questionId] || [];
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter((val) => val !== optionId)
        : [...currentValues, optionId];
      setAnswers((prev) => ({ ...prev, [questionId]: newValues }));
    } else {
      // Handle single select - store single option ID
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    
    // Check if current question is answered
    const questionKey = currentQuestion.id;
    const answer = answers[questionKey];
    
    if (currentQuestion.type.toUpperCase() === "MULTI_SELECT") {
      // For multi-select, check if at least one option is selected
      return answer && Array.isArray(answer) && answer.length > 0;
    }
    // For SELECT type, check if an option ID is selected
    return answer !== undefined && answer !== null && answer !== "";
  };

  const handleNext = async () => {
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    const selectedOption = answers[questionId];
    
    // For multi-select, ensure it's an array; for single-select, keep as single value
    const isMultiSelect = currentQuestion.type.toUpperCase() === "MULTI_SELECT";
    const optionToSend = isMultiSelect 
      ? (Array.isArray(selectedOption) ? selectedOption : [selectedOption])
      : selectedOption;
    
    console.log("📝 Submitting answer:", { 
      questionId, 
      authId: user.id, 
      selectedOption: optionToSend,
      isMultiSelect,
      type: currentQuestion.type 
    });
    
    try {
      // Submit the current answer to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/questionnaire/responses`,
        { 
          questionId, 
          authId: user.id, 
          selectedOption: optionToSend
        }
      );
      console.log("✅ Response saved:", response.data);
      
      // Move to next step or submit
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Last question answered, generate recommendations
        handleSubmit();
      }
    } catch (error) {
      console.error("❌ Error submitting response:", error);
      setError("Failed to save your answer. Please try again.");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/questionnaire/recommendations`,
        { authId: user.id }
      );

      console.log("✅ Room recommendations generated:", response.data);

      const recommendedRoomNames = response.data.recommendedRooms.map(
        (room) => room.name
      );
      setEncryptedItem("recommendedRooms", recommendedRoomNames);
      setEncryptedItem("onboarding_completed", "true");

      onComplete();
    } catch (err) {
      if (
        err.response?.status === 400 &&
        err.response?.data?.error === "Questionnaire incomplete"
      ) {
        // User hasn't answered all questions
        const { answeredQuestions, totalQuestions, remainingQuestions } =
          err.response.data;
        setError(
          `Please answer all questions. You've answered ${answeredQuestions} out of ${totalQuestions} questions. ${remainingQuestions} remaining.`
        );
      } else if (err.response?.status === 404) {
        setError(
          "No questionnaire responses found. Please complete the questionnaire first."
        );
      } else if (err.response?.status === 400) {
        setError("Invalid user ID. Please try signing in again.");
      } else {
        setError("Failed to generate room recommendations. Please try again.");
      }
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Animated background elements */}
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

      {/* Header */}
      <div className="relative z-10 flex justify-center items-center pt-8 mb-8">
        <div className="bg-gray-800/60 backdrop-blur-lg py-4 px-8 rounded-xl shadow-2xl border border-gray-300/50">
          <img src="/logo.png" alt="IdentifYou Logo" className="h-10" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-400">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
          {/* Question header */}
          <div className="text-center mb-8">
            {/* <h2 className="text-3xl font-bold text-white mb-2">
              {currentQuestion.title || "Title"}
            </h2> */}
            <p className="text-gray-300">{currentQuestion?.questionText || "Question text not available"}</p>
          </div>

          {/* Question options */}
          <div className="space-y-6">
            {currentQuestion && (
              <div className="space-y-3">
                {currentQuestion.type.toUpperCase() === "SELECT" && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          handleInputChange(currentQuestion.id, option.id, false)
                        }
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          answers[currentQuestion.id] === option.id
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.optionLabel}</span>
                          {answers[currentQuestion.id] === option.id && (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type.toUpperCase() === "MULTI_SELECT" && (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          handleInputChange(currentQuestion.id, option.id, true)
                        }
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          answers[currentQuestion.id]?.includes(option.id)
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.optionLabel}</span>
                          {answers[currentQuestion.id]?.includes(option.id) && (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <button
              onClick={() => handleNext(currentQuestion.id, user.id, answers[currentQuestion.id])}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/30"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : currentStep === totalSteps ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
