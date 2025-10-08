import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();

  const onClick = () => {
    navigate(-1); // Navigate back to the previous page
  };
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 flex z-60 items-center space-x-2 mx-4 text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl border border-white px-3 py-2 backdrop-blur-sm"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}
