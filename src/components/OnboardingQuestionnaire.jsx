import { useState } from "react";
import { ChevronRight, CheckCircle } from "lucide-react";
import { setEncryptedItem } from "../utils/encryption.js";

export default function OnboardingQuestionnaire({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    age: "",
    gender: "",
    mainConcern: "",
    supportType: "",
    experience: "",
    goals: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const questions = [
    {
      id: 1,
      title: "Let's get to know you better",
      subtitle: "This helps us provide better support",
      fields: [
        {
          name: "age",
          label: "What's your age range?",
          type: "select",
          options: [
            { value: "13-17", label: "13-17 years" },
            { value: "18-24", label: "18-24 years" },
            { value: "25-34", label: "25-34 years" },
          ]
        },
        {
          name: "gender",
          label: "How do you identify?",
          type: "select",
          options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "non-binary", label: "Non-binary" },
            { value: "prefer-not-to-say", label: "Prefer not to say" },
            { value: "other", label: "Other" }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "What brings you here?",
      subtitle: "Understanding your needs helps us support you better",
      fields: [
        {
          name: "mainConcern",
          label: "What's your main area of concern?",
          type: "select",
          options: [
            { value: "bullying", label: "Bullying & Harassment" },
            { value: "domestic-issues", label: "Domestic Issues" },
            { value: "identity-crisis", label: "Identity Crisis" },
            { value: "mental-health", label: "Mental Health" },
            { value: "academic-stress", label: "Academic Stress" },
            { value: "other", label: "Other" }
          ]
        },
        {
          name: "supportType",
          label: "What type of support are you looking for?",
          type: "select",
          options: [
            { value: "peer-support", label: "Peer Support & Community" },
            { value: "professional-guidance", label: "Professional Guidance" },
            { value: "anonymous-chat", label: "Anonymous Chat" },
            { value: "resource-sharing", label: "Resource Sharing" },
            { value: "just-listening", label: "Someone to Listen" }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "Your goals with IdentifYou",
      subtitle: "Help us personalize your experience",
      fields: [
        {
          name: "experience",
          label: "Have you used similar platforms before?",
          type: "select",
          options: [
            { value: "first-time", label: "This is my first time" },
            { value: "some-experience", label: "I have some experience" },
            { value: "experienced", label: "I'm experienced with these platforms" }
          ]
        },
        {
          name: "goals",
          label: "What do you hope to achieve? (Select all that apply)",
          type: "multi-select",
          options: [
            { value: "find-community", label: "Find a supportive community" },
            { value: "get-advice", label: "Get advice and guidance" },
            { value: "share-experience", label: "Share my experiences" },
            { value: "help-others", label: "Help others facing similar issues" },
            { value: "learn-coping", label: "Learn coping strategies" },
            { value: "build-confidence", label: "Build confidence and self-esteem" }
          ]
        }
      ]
    }
  ];

  const currentQuestion = questions.find(q => q.id === currentStep);
  const totalSteps = questions.length;

  const handleInputChange = (fieldName, value) => {
    if (fieldName === "goals") {
      // Handle multi-select
      const currentGoals = answers.goals || [];
      const newGoals = currentGoals.includes(value)
        ? currentGoals.filter(goal => goal !== value)
        : [...currentGoals, value];
      setAnswers(prev => ({ ...prev, goals: newGoals }));
    } else {
      setAnswers(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  const canProceed = () => {
    const currentFields = currentQuestion.fields;
    return currentFields.every(field => {
      if (field.type === "multi-select") {
        return answers[field.name] && answers[field.name].length > 0;
      }
      return answers[field.name] && answers[field.name].trim() !== "";
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRecommendedRooms = () => {
    const rooms = [];
    
    // Based on main concern
    if (answers.mainConcern === "bullying") {
      rooms.push("Anti Bullying");
    }
    if (answers.mainConcern === "domestic-issues") {
      rooms.push("Domestic Issues");
    }
    if (answers.mainConcern === "identity-crisis") {
      rooms.push("Get Identified");
    }
    if (answers.mainConcern === "academic-stress") {
      rooms.push("Study Group");
    }
    if (answers.mainConcern === "mental-health") {
      rooms.push("Mental Health Support");
    }
    if (answers.mainConcern === "relationships") {
      rooms.push("Relationship Advice");
    }
    
    // Always include introductions for newcomers
    if (!rooms.includes("Introductions")) {
      rooms.push("Introductions");
    }
    
    // Add rooms based on support type
    if (answers.supportType === "peer-support") {
      if (!rooms.includes("General Support")) {
        rooms.push("General Support");
      }
    }
    if (answers.supportType === "professional-guidance") {
      if (!rooms.includes("Professional Help")) {
        rooms.push("Professional Help");
      }
    }
    if (answers.supportType === "anonymous-chat") {
      if (!rooms.includes("Anonymous Chat")) {
        rooms.push("Anonymous Chat");
      }
    }
    if (answers.supportType === "resource-sharing") {
      if (!rooms.includes("Resource Sharing")) {
        rooms.push("Resource Sharing");
      }
    }
    
    // Add rooms based on goals
    if (answers.goals && answers.goals.includes("find-community")) {
      if (!rooms.includes("General Support")) {
        rooms.push("General Support");
      }
    }
    if (answers.goals && answers.goals.includes("help-others")) {
      if (!rooms.includes("Volunteer Hub")) {
        rooms.push("Volunteer Hub");
      }
    }
    if (answers.goals && answers.goals.includes("learn-coping")) {
      if (!rooms.includes("Coping Strategies")) {
        rooms.push("Coping Strategies");
      }
    }
    if (answers.goals && answers.goals.includes("build-confidence")) {
      if (!rooms.includes("Confidence Building")) {
        rooms.push("Confidence Building");
      }
    }
    
    // Ensure we have at least some default rooms
    return rooms.length > 0 ? rooms : ["Introductions", "General Support"];
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Generate personalized room recommendations
      const recommendedRooms = getRecommendedRooms();

      // Save questionnaire data to localStorage (Stack doesn't have user metadata like Supabase)
      setEncryptedItem("onboarding_completed", "true");
      setEncryptedItem("questionnaire_data", JSON.stringify(answers));
      setEncryptedItem("recommended_rooms", JSON.stringify(recommendedRooms));
      setEncryptedItem("questionnaire_completed_at", new Date().toISOString());

      // Store recommended rooms and answers in encrypted localStorage
      setEncryptedItem('recommendedRooms', recommendedRooms);
      setEncryptedItem('questionnaireAnswers', answers);
      setEncryptedItem('onboarding_completed', 'true');

      onComplete();
    } catch (err) {
      console.error("Error saving questionnaire:", err);
      setError("Failed to save your responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
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
            <h2 className="text-3xl font-bold text-white mb-2">{currentQuestion.title}</h2>
            <p className="text-gray-300">{currentQuestion.subtitle}</p>
          </div>

          {/* Question fields */}
          <div className="space-y-6">
            {currentQuestion.fields.map((field) => (
              <div key={field.name} className="space-y-3">
                <label className="block text-lg font-medium text-white mb-3">
                  {field.label}
                </label>
                
                {field.type === "select" && (
                  <div className="space-y-2">
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange(field.name, option.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          answers[field.name] === option.value
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {answers[field.name] === option.value && (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {field.type === "multi-select" && (
                  <div className="space-y-2">
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange(field.name, option.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          answers[field.name]?.includes(option.value)
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-purple-400 hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {answers[field.name]?.includes(option.value) && (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
              onClick={handleNext}
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