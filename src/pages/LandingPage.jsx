import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Users,
  Shield,
  MessageCircle,
  Target,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import FormSidebar from "../components/FormSidebar";

function IdentifYouLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      // Check if there's a hash in the URL (OAuth callback)
      if (window.location.hash) {
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          return;
        }
      }

      // Regular session check
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    };

    handleAuthCallback();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // console.log(session);

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#user-personas", label: "Community" },
    { href: "#support-areas", label: "Features" },
  ];

  const Header = () => (
    <header className="relative flex items-center justify-between p-4 bg-gray-900 text-white shadow-2xl border-b border-purple-500/20 z-50">
      <div className="absolute inset-0 bg-purple-600/5"></div>

      <div className="relative flex items-center justify-between space-x-4">
        <div className="flex items-center justify-center">
          <button onClick={() => navigate("/")}>
            <img src="/logo.png" alt="IdentifYou Logo" className="w-44 h-10" />
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div
        className="absolute top-0 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute top-2 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-bounce"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-1 left-1/2 w-1 h-1 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: "1s" }}
      ></div>
    </header>
  );

  const HeroSection = () => (
    <section className="relative min-h-screen bg-gray-900 text-white overflow-hidden flex items-center">
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

      <div className="relative container mx-auto px-4 py-20 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <span className="bg-purple-600 text-white text-sm font-semibold px-6 py-2 rounded-full shadow-lg">
              Building Stronger Communities
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 text-white">
            We Are Making Stronger
            <br />
            <span className="text-purple-400">and Better Generations</span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            Empowering Youth for Stronger Futures: IdentifYou – Your partner in
            overcoming domestic issues, bullying, and identity crises, driven by
            the energy and determination of our young mentors
          </p>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
    </section>
  );

  const HowItWorksSection = () => {
    const steps = [
      {
        icon: <Users className="w-8 h-8" />,
        title: "BEGIN WITH LOGIN OR REGISTER",
        description: "Your privacy is our priority, ensuring a secure start.",
        color: "bg-purple-600",
      },
      {
        icon: <Shield className="w-8 h-8" />,
        title: "FILTER OUT AND CREATE GROUP",
        description:
          "We place you where you'll thrive, fostering trust in your community.",
        color: "bg-blue-600",
      },
      {
        icon: <MessageCircle className="w-8 h-8" />,
        title: "GET PLACED INTO GROUP CHAT",
        description: "Our chat environment is safe and judgment-free.",
        color: "bg-green-600",
      },
      {
        icon: <Users className="w-8 h-8" />,
        title: "CONNECT WITH GUIDES & PEERS",
        description:
          "Counselors guide you, making your journey supportive and enjoyable.",
        color: "bg-indigo-600",
      },
      {
        icon: <Target className="w-8 h-8" />,
        title: "RECEIVE PERSONALIZED PLANS",
        description: "Our plans help you achieve your goals with support.",
        color: "bg-teal-600",
      },
    ];

    return (
      <section id="how-it-works" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              How Identifyou Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our 5-step process guides you through a transformative journey of
              growth and connection
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-purple-600 transform -translate-y-1/2 z-0 rounded-full"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="text-center group flex flex-col items-center"
                >
                  <div
                    className={`w-20 h-20 mx-auto mb-6 ${step.color} rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                  >
                    {step.icon}
                  </div>
                  <div className="bg-gray-700 rounded-xl p-6 shadow-lg border border-gray-600 group-hover:shadow-xl transition-shadow duration-300 hover:border-purple-500/50 flex flex-col flex-grow w-full h-48">
                    <h3 className="font-bold text-sm text-white mb-3 uppercase tracking-wide">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed flex-grow flex items-center justify-center text-center lg:text-sm xl:md">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const UserPersonasSection = () => {
    const personas = [
      {
        title: "Young Teens (13+)",
        ageGroup: "Ages 13-16",
        description:
          "A safe space for early teenagers to navigate adolescence, build confidence, and connect with peers.",
        icon: <Users className="w-8 h-8" />,
        color: "bg-blue-600",
      },
      {
        title: "Older Teens (17+)",
        ageGroup: "Ages 17-19",
        description:
          "Support for older teens transitioning to adulthood, facing college decisions, and finding their place.",
        icon: <Target className="w-8 h-8" />,
        color: "bg-purple-600",
      },
      {
        title: "Counsellors",
        ageGroup: "Professional Guides",
        description:
          "Trained mentors who provide guidance, facilitate discussions, and create safe spaces for growth.",
        icon: <Shield className="w-8 h-8" />,
        color: "bg-green-600",
      },
    ];

    const handleChatRedirect = () => {
      navigate("/chat");
      console.log("Redirecting to chat page...");
    };

    return (
      <section
        id="user-personas"
        className="py-16 sm:py-20 lg:py-24 bg-gray-900"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Join Your Community
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Find your place in our supportive community, whether you're
              seeking guidance or ready to guide others
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-700 hover:border-purple-500/50 flex flex-col"
              >
                <div className="relative h-32 bg-gray-700 flex items-center justify-center">
                  <div
                    className={`w-16 h-16 ${persona.color} rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {persona.icon}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {persona.title}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${persona.color} text-white`}
                    >
                      {persona.ageGroup}
                    </span>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-6 text-center flex-grow">
                    {persona.description}
                  </p>

                  <button
                    onClick={handleChatRedirect}
                    className={`w-full mt-auto ${persona.color} hover:opacity-90 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2`}
                  >
                    Join Chat
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      {/* FormSidebar Component with Landing Page flag */}
      <FormSidebar isLandingPage={true} />

      <style>
        {`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-float-slow {
            animation: float-slow 4s ease-in-out infinite;
          }
        `}
      </style>
      {!session && <div className="fixed bottom-6 right-4 sm:right-6 z-50 animate-float-slow">
        <button
          onClick={() => navigate("/auth")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 sm:space-x-3 border border-purple-500/20 max-w-xs sm:max-w-none"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium text-xs sm:text-sm md:text-base">
            What are you dealing with today?
          </span>
        </button>
      </div>}

      <div className="min-h-screen bg-gray-900 font-sans">
        <Header />
        <main>
          <HeroSection />
          <UserPersonasSection />
          <HowItWorksSection />
        </main>
      </div>
    </>
  );
}

export default IdentifYouLanding;
