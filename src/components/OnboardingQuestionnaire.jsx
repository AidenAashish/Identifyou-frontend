import { useState } from "react";
import { ChevronRight, CheckCircle } from "lucide-react";
import { setEncryptedItem } from "../utils/encryption.js";
import axios from "axios";

export default function OnboardingQuestionnaire({ user, questionnaire, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questionnaire[currentStep - 1];
  const totalSteps = questionnaire.length;

  const handleInputChange = (questionId, optionId, isMultiSelect) => {
    if (isMultiSelect) {
      const currentValues = answers[questionId] || [];
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter((val) => val !== optionId)
        : [...currentValues, optionId];
      setAnswers((prev) => ({ ...prev, [questionId]: newValues }));
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type.toUpperCase() === "MULTI_SELECT") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== null && answer !== "";
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const selected = answers[questionId];
    const isMultiSelect = currentQuestion.type.toUpperCase() === "MULTI_SELECT";
    const selectedOption = isMultiSelect
      ? Array.isArray(selected)
        ? selected
        : [selected]
      : selected;

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/questionnaire/responses`,
        {
          questionId,
          authId: user.id,
          selectedOption,
        }
      );

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit();
      }
    } catch (err) {
      console.error("❌ Error submitting response:", err);
      setError("Failed to save your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/questionnaire/recommendations`,
        { authId: user.id }
      );

      console.log("✅ Recommendations generated:", response.data);
      const roomNames = response.data.recommendedRooms.map((r) => r.name);

      setEncryptedItem("recommendedRooms", roomNames);
      setEncryptedItem("onboarding_completed", "true");

      onComplete();
    } catch (err) {
      console.error("❌ Error generating recommendations:", err);
      setError("Could not complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Loading Questionnaire...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-center items-center pt-8 mb-8">
        <div className="bg-gray-800/60 backdrop-blur-lg py-4 px-8 rounded-xl shadow-2xl border border-gray-300/50">
          <img src="/logo.png" alt="IdentifYou Logo" className="h-10" />
        </div>
      </div>

      {/* Progress */}
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
          <div className="text-center mb-8">
            <p className="text-gray-300">
              {currentQuestion?.questionText || "Loading question..."}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion?.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  handleInputChange(
                    currentQuestion.id,
                    option.id,
                    currentQuestion.type.toUpperCase() === "MULTI_SELECT"
                  )
                }
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                  (currentQuestion.type.toUpperCase() === "MULTI_SELECT" &&
                    answers[currentQuestion.id]?.includes(option.id)) ||
                  answers[currentQuestion.id] === option.id
                    ? "border-purple-500 bg-purple-500/20 text-white"
                    : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.optionLabel}</span>
                  {(answers[currentQuestion.id] === option.id ||
                    answers[currentQuestion.id]?.includes(option.id)) && (
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="text-gray-400 hover:text-white transition disabled:opacity-30"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                "Complete Setup"
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
