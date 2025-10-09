import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import OnboardingQuestionnaire from "../components/OnboardingQuestionnaire";
import { useUser } from "@stackframe/react";

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const user = useUser({ or: 'return-null' });
  const loading = user === undefined;

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

  return (
    <OnboardingQuestionnaire
      user={user}
      onComplete={handleQuestionnaireComplete}
    />
  );
}
